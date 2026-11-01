import { NextRequest } from "next/server";

const mockDb = {
  user: { findUnique: jest.fn() },
  group: { findUnique: jest.fn(), create: jest.fn() },
  adminConfig: { create: jest.fn() },
  person: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  assignment: { count: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  wishlistItem: { deleteMany: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(),
};
const mockSession = {
  isAdmin: true, adminGroupId: "group-1" as string | undefined,
  adminGroupName: undefined as string | undefined, adminInviteCode: undefined as string | undefined,
  adminPersonId: undefined as string | undefined,
  isLoggedIn: false, personId: undefined as string | undefined, personName: undefined as string | undefined,
  groupId: undefined as string | undefined, groupName: undefined as string | undefined,
  loginMethod: undefined as string | undefined,
  pendingPersonId: undefined as string | undefined, pendingGroupId: undefined as string | undefined,
  save: jest.fn(),
};
const mockHash = jest.fn();
jest.mock("@/lib/db", () => ({ prisma: mockDb }));
jest.mock("@/lib/session", () => ({ getSession: async () => mockSession }));
jest.mock("bcryptjs", () => ({ __esModule: true, default: { hash: mockHash } }));
jest.mock("@/lib/rate-limit", () => ({ authRateLimit: () => ({ success: true }), joinRateLimit: () => ({ success: true }) }));
jest.mock("@/lib/utils", () => ({ generateGroupInviteCode: () => "A2B3C4", validateWishlistItems: () => ({ valid: true }) }));

import { POST as createGroup } from "@/app/api/groups/create/route";
import { POST as requestJoin } from "@/app/api/join/request/route";
import { GET as joinStatus } from "@/app/api/join/status/route";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as listPeople } from "@/app/api/people/route";
import { PATCH as review } from "@/app/api/people/[id]/route";
import { POST as draw } from "@/app/api/assignments/generate/route";
import { GET as listAssignments } from "@/app/api/assignments/route";
import { POST as wishlist } from "@/app/api/wishlist/route";
import { GET as personalData } from "@/app/api/auth/person-data/route";

const group = { id: "group-1", name: "Grupo Teste", inviteCode: "A2B3C4", year: 2026 };
const person = { id: "person-1", name: "Ana Silva", groupId: group.id, status: "PENDING", group, adminFor: null };
const post = (path: string, body: object) => new NextRequest(`http://localhost:3000${path}`, { method: "POST", body: JSON.stringify(body) });
const get = (path: string) => new NextRequest(`http://localhost:3000${path}`);
function guest() { mockSession.isAdmin = false; mockSession.adminGroupId = undefined; }

beforeEach(() => {
  jest.resetAllMocks();
  Object.assign(mockSession, { isAdmin: true, adminGroupId: group.id, isLoggedIn: false, personId: undefined, personName: undefined, groupId: undefined, groupName: undefined, loginMethod: undefined, pendingPersonId: undefined, pendingGroupId: undefined, adminPersonId: undefined });
  mockSession.save.mockResolvedValue(undefined);
  mockHash.mockResolvedValue("hashed");
  mockDb.group.findUnique.mockResolvedValue(null);
  mockDb.group.create.mockResolvedValue({ ...group, people: [{ id: "admin-person" }] });
  mockDb.$transaction.mockImplementation((callback) => callback(mockDb));
  mockDb.person.findFirst.mockResolvedValue(null);
  mockDb.person.findUnique.mockResolvedValue(person);
  mockDb.person.create.mockResolvedValue(person);
  mockDb.person.update.mockImplementation(async ({ where, data }) => ({ ...person, id: where.id, ...data }));
  mockDb.assignment.count.mockResolvedValue(0);
  mockDb.assignment.findMany.mockResolvedValue([]);
  mockDb.assignment.create.mockImplementation(async ({ data }) => data);
});

describe("administrator review", () => {
  test.each(["APPROVED", "REJECTED"])("can set a request to %s", async (status) => {
    const response = await review(post("/api/people/person-1", { status }), { params: { id: person.id } });
    expect(response.status).toBe(200);
    expect(mockDb.person.update).toHaveBeenCalledWith({ where: { id: person.id }, data: { status } });
  });
  test("cannot review requests from another group", async () => {
    mockDb.person.findUnique.mockResolvedValue({ ...person, groupId: "another-group" });
    expect((await review(post("/api/people/person-1", { status: "APPROVED" }), { params: { id: person.id } })).status).toBe(404);
    expect(mockDb.person.update).not.toHaveBeenCalled();
  });
  test("cannot approve after a draw", async () => {
    mockDb.assignment.count.mockResolvedValue(3);
    expect((await review(post("/api/people/person-1", { status: "APPROVED" }), { params: { id: person.id } })).status).toBe(409);
  });
  test("can decline a pending request after a draw without changing its participants", async () => {
    mockDb.assignment.count.mockResolvedValue(3);
    expect((await review(post("/api/people/person-1", { status: "REJECTED" }), { params: { id: person.id } })).status).toBe(200);
  });
  test("requires administrator access", async () => {
    guest();
    expect((await review(post("/api/people/person-1", { status: "APPROVED" }), { params: { id: person.id } })).status).toBe(403);
    expect((await listPeople(get(`/api/people?groupId=${group.id}`))).status).toBe(403);
    expect((await listAssignments(get(`/api/assignments?groupId=${group.id}`))).status).toBe(403);
  });
});

describe("approved participant access", () => {
  test("does not allow a stale session to write a pending participant's wishlist", async () => {
    guest(); Object.assign(mockSession, { isLoggedIn: true, personId: person.id, groupId: group.id });
    const response = await wishlist(post("/api/wishlist", { personId: person.id, items: [{ title: "Livro", link: "https://example.com/livro" }] }));
    expect(response.status).toBe(403);
    expect(mockDb.wishlistItem.deleteMany).not.toHaveBeenCalled();
  });
  test("filters personal data by current approval and group", async () => {
    guest(); Object.assign(mockSession, { isLoggedIn: true, personId: person.id, groupId: group.id });
    mockDb.person.findUnique.mockResolvedValue(null);
    expect((await personalData()).status).toBe(403);
    expect(mockDb.person.findUnique.mock.calls[0][0].where).toEqual({ id: person.id, groupId: group.id, status: "APPROVED" });
  });
  test("draw selects only approved participants", async () => {
    mockDb.person.findMany.mockResolvedValue([{ id: "one", name: "Um Silva" }, { id: "two", name: "Dois Silva" }, { id: "three", name: "Três Silva" }]);
    expect((await draw(post("/api/assignments/generate", { groupId: group.id, year: 2026 }))).status).toBe(200);
    expect(mockDb.person.findMany.mock.calls[0][0].where).toEqual({ groupId: group.id, status: "APPROVED" });
    expect(mockDb.assignment.create).toHaveBeenCalledTimes(3);
  });

  test("draw allows two approved participants to give to each other", async () => {
    mockDb.person.findMany.mockResolvedValue([{ id: "one", name: "Ana Silva" }, { id: "two", name: "Bia Silva" }]);
    const response = await draw(post("/api/assignments/generate", { groupId: group.id, year: 2026 }));
    expect(response.status).toBe(200);
    expect((await response.json()).assignments).toEqual([
      { groupId: group.id, giverId: "one", receiverId: "two", year: 2026 },
      { groupId: group.id, giverId: "two", receiverId: "one", year: 2026 },
    ]);
  });

  test.each([0, 1])("explains why %i approved participants cannot be drawn", async count => {
    mockDb.person.findMany.mockResolvedValue(Array.from({ length: count }, () => ({ id: "one", name: "Ana Silva" })));
    const response = await draw(post("/api/assignments/generate", { groupId: group.id, year: 2026 }));
    expect(response.status).toBe(400);
    const { error } = await response.json();
    expect(error).toMatch(count === 0 ? /Ainda não há participantes aprovados/ : /Falta aprovar mais 1 participante/);
    expect(error).toMatch(/tir(?:e|ar) a si mesm/);
    expect(mockDb.assignment.create).not.toHaveBeenCalled();
  });
});
