import { NextRequest } from "next/server";

const mockPrisma = {
  adminConfig: { findUnique: jest.fn(), updateMany: jest.fn() },
  person: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
  assignment: { findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
  $transaction: jest.fn(),
};
const mockSession = {
  userId: undefined as string | undefined,
  isAdmin: true,
  adminGroupId: "group-1",
  adminGroupName: "Grupo",
  adminInviteCode: "ABC123",
  adminPersonId: undefined as string | undefined,
  isLoggedIn: false,
  personId: undefined as string | undefined,
  personName: undefined as string | undefined,
  groupId: undefined as string | undefined,
  groupName: undefined as string | undefined,
  loginMethod: undefined as string | undefined,
  save: jest.fn(),
};
const mockCompare = jest.fn();

jest.mock("@/lib/db", () => ({ prisma: mockPrisma }));
jest.mock("@/lib/session", () => ({ getSession: jest.fn(async () => mockSession) }));
jest.mock("@/lib/rate-limit", () => ({ adminAuthRateLimit: () => ({ success: true }) }));
jest.mock("bcryptjs", () => ({ __esModule: true, default: { compare: mockCompare } }));

import { POST as adminLogin } from "@/app/api/admin/auth/route";
import { DELETE as deletePerson } from "@/app/api/people/[id]/route";
import { POST as generateAssignments } from "@/app/api/assignments/generate/route";
import { POST as joinDraw } from "@/app/api/admin/participation/route";

const group = { id: "group-1", name: "Grupo", inviteCode: "ABC123", year: 2026 };
const owner = { id: "admin-person", name: "Ana", groupId: group.id, status: "APPROVED" };

function request(path: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost:3000${path}`, { method: "POST", body: JSON.stringify(body) });
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(mockSession, {
    userId: undefined,
    isAdmin: true, adminGroupId: group.id, adminPersonId: undefined,
    isLoggedIn: false, personId: undefined, personName: undefined,
    groupId: undefined, groupName: undefined, loginMethod: undefined,
  });
  mockCompare.mockResolvedValue(true);
  mockSession.save.mockResolvedValue(undefined);
  mockPrisma.adminConfig.findUnique.mockResolvedValue({ group, person: owner, hashedPassword: "hash" });
  mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));
  mockPrisma.adminConfig.updateMany.mockResolvedValue({ count: 1 });
  mockPrisma.person.findFirst.mockResolvedValue(null);
  mockPrisma.person.create.mockResolvedValue(owner);
  mockPrisma.assignment.count.mockResolvedValue(0);
});

test("administrator login also authenticates the linked participant", async () => {
  const response = await adminLogin(request("/api/admin/auth", { groupId: group.id, password: "1234" }));
  expect(response.status).toBe(200);
  expect(mockSession).toMatchObject({
    isAdmin: true, adminGroupId: group.id, adminPersonId: owner.id,
    isLoggedIn: true, personId: owner.id, personName: owner.name,
    groupId: group.id, groupName: group.name, loginMethod: "admin",
  });
  expect(mockSession.save).toHaveBeenCalledTimes(1);
});

test("legacy groups can still authenticate without retaining another participant's identity", async () => {
  Object.assign(mockSession, { isLoggedIn: true, personId: "previous-person", groupId: "previous-group" });
  mockPrisma.adminConfig.findUnique.mockResolvedValue({ group, person: null, hashedPassword: "hash" });
  const response = await adminLogin(request("/api/admin/auth", { groupId: group.id, password: "1234" }));
  expect(response.status).toBe(200);
  expect(mockSession.isAdmin).toBe(true);
  expect(mockSession.isLoggedIn).toBe(false);
  expect(mockSession.personId).toBeUndefined();
  expect(mockSession.groupId).toBeUndefined();
});

test("invalid credentials do not authenticate the administrator as a participant", async () => {
  mockCompare.mockResolvedValue(false);
  const response = await adminLogin(request("/api/admin/auth", { groupId: group.id, password: "wrong" }));
  expect(response.status).toBe(401);
  expect(mockSession.save).not.toHaveBeenCalled();
});

test("a group password cannot authenticate the owner's account", async () => {
  mockPrisma.adminConfig.findUnique.mockResolvedValue({ group, person: owner, userId: "owner-account", hashedPassword: "hash" });
  expect((await adminLogin(request("/api/admin/auth", { groupId: group.id, password: "1234" }))).status).toBe(401);
  expect(mockSession.save).not.toHaveBeenCalled();
});

test("the administrator cannot remove the linked participant", async () => {
  mockPrisma.person.findUnique.mockResolvedValue({ ...owner, adminFor: { id: "config-1" } });
  const response = await deletePerson(new NextRequest("http://localhost:3000/api/people/admin-person", { method: "DELETE" }), { params: { id: owner.id } });
  expect(response.status).toBe(400);
  expect((await response.json()).error).toContain("não pode ser removido");
  expect(mockPrisma.person.delete).not.toHaveBeenCalled();
});

test("other participants can still be removed", async () => {
  mockPrisma.person.findUnique.mockResolvedValue({ id: "other-person", groupId: group.id, adminFor: null });
  const response = await deletePerson(new NextRequest("http://localhost:3000/api/people/other-person", { method: "DELETE" }), { params: { id: "other-person" } });
  expect(response.status).toBe(200);
  expect(mockPrisma.person.delete).toHaveBeenCalledWith({ where: { id: "other-person" } });
});

test("the draw includes the administrator as both giver and receiver", async () => {
  const people = [owner, { id: "person-2", name: "Bruno" }, { id: "person-3", name: "Carla" }];
  mockPrisma.person.findMany.mockResolvedValue(people);
  mockPrisma.assignment.findMany.mockResolvedValue([]);
  mockPrisma.assignment.create.mockImplementation(async ({ data }) => data);
  const response = await generateAssignments(request("/api/assignments/generate", { groupId: group.id, year: 2026 }));
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(body.count).toBe(3);
  expect(body.assignments.filter((assignment: { giverId: string }) => assignment.giverId === owner.id)).toHaveLength(1);
  expect(body.assignments.filter((assignment: { receiverId: string }) => assignment.receiverId === owner.id)).toHaveLength(1);
  expect(body.assignments.every((assignment: { giverId: string; receiverId: string }) => assignment.giverId !== assignment.receiverId)).toBe(true);
});

describe("joining an existing group as the administrator", () => {
  beforeEach(() => {
    mockPrisma.adminConfig.findUnique.mockResolvedValue({ group, person: null });
  });

  test("registers and authenticates the administrator in the group from the session", async () => {
    const response = await joinDraw(request("/api/admin/participation", { name: "  Ana  ", groupId: "another-group" }));
    expect(response.status).toBe(200);
    expect(mockPrisma.person.create).toHaveBeenCalledWith({ data: { name: "Ana", groupId: group.id, userId: undefined } });
    expect(mockPrisma.adminConfig.updateMany).toHaveBeenCalledWith({ where: { groupId: group.id, personId: null }, data: { personId: owner.id } });
    expect(mockSession).toMatchObject({ personId: owner.id, adminPersonId: owner.id, groupId: group.id, isLoggedIn: true });
  });

  test("repeated requests reuse the linked participant", async () => {
    mockPrisma.adminConfig.findUnique.mockResolvedValue({ group, person: owner });
    const response = await joinDraw(request("/api/admin/participation", { name: "Ana" }));
    expect(response.status).toBe(200);
    expect(mockPrisma.person.create).not.toHaveBeenCalled();
    expect(mockPrisma.adminConfig.updateMany).not.toHaveBeenCalled();
  });

  test("can link an existing participant without duplicating the person", async () => {
    mockPrisma.person.findFirst.mockResolvedValue(owner);
    mockPrisma.assignment.count.mockResolvedValue(3);
    const response = await joinDraw(request("/api/admin/participation", { personId: owner.id }));
    expect(response.status).toBe(200);
    expect(mockPrisma.person.findFirst).toHaveBeenCalledWith({ where: { id: owner.id, groupId: group.id } });
    expect(mockPrisma.person.create).not.toHaveBeenCalled();
  });

  test("cannot link a person from another group", async () => {
    const response = await joinDraw(request("/api/admin/participation", { personId: "another-person" }));
    expect(response.status).toBe(404);
    expect(mockPrisma.adminConfig.updateMany).not.toHaveBeenCalled();
  });

  test("cannot take over another account's participation", async () => {
    mockSession.userId = "admin-account";
    mockPrisma.person.findFirst.mockResolvedValue({ ...owner, userId: "participant-account" });
    expect((await joinDraw(request("/api/admin/participation", { personId: owner.id }))).status).toBe(409);
    expect(mockPrisma.adminConfig.updateMany).not.toHaveBeenCalled();
  });

  test("requires a name when creating a participant", async () => {
    const response = await joinDraw(request("/api/admin/participation", { name: "  " }));
    expect(response.status).toBe(400);
    expect(mockPrisma.person.create).not.toHaveBeenCalled();
  });

  test("does not add someone after the draw has already happened", async () => {
    mockPrisma.assignment.count.mockResolvedValue(3);
    const response = await joinDraw(request("/api/admin/participation", { name: "Ana" }));
    expect(response.status).toBe(409);
    expect(mockPrisma.person.create).not.toHaveBeenCalled();
  });

  test("requires an administrator session", async () => {
    mockSession.isAdmin = false;
    const response = await joinDraw(request("/api/admin/participation", { name: "Ana" }));
    expect(response.status).toBe(403);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  test("rolls back when another session links the administrator first", async () => {
    mockPrisma.adminConfig.updateMany.mockResolvedValue({ count: 0 });
    const response = await joinDraw(request("/api/admin/participation", { name: "Ana" }));
    expect(response.status).toBe(409);
    expect(mockSession.save).not.toHaveBeenCalled();
  });
});
