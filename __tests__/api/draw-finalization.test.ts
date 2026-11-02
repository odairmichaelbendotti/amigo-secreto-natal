import { NextRequest } from "next/server";
import type { SessionData } from "@/lib/session";

const mockDb = {
  group: { findUnique: jest.fn(), update: jest.fn() },
  person: { findFirst: jest.fn(), findMany: jest.fn() },
  assignment: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
  $transaction: jest.fn(),
};
const mockSession: SessionData = {};
jest.mock("@/lib/db", () => ({ prisma: mockDb }));
jest.mock("@/lib/session", () => ({ getSession: async () => mockSession }));
import { GET, DELETE } from "@/app/api/assignments/route";
import { POST as generate } from "@/app/api/assignments/generate/route";
import { POST as finish } from "@/app/api/groups/[id]/finish/route";

const finishedAt = new Date("2026-12-25T12:00:00Z");
const pair = { id: "pair-1", giverId: "p1", receiverId: "p2", giver: { name: "Ana Silva", userId: "private-user" }, receiver: { name: "Bia Silva", userId: "private-user-2", wishlistItems: [{ title: "Livro", link: "https://example.com" }] } };
const request = (method = "GET", body?: object) => new NextRequest("http://localhost:3000/api/assignments?groupId=g1", { method, ...(body ? { body: JSON.stringify(body) } : {}) });
const finishRequest = () => finish(request("POST"), { params: { id: "g1" } });
beforeEach(() => {
  jest.resetAllMocks();
  for (const key of Object.keys(mockSession)) delete (mockSession as Record<string, unknown>)[key];
  Object.assign(mockSession, { isAdmin: true, adminGroupId: "g1" });
  mockDb.group.findUnique.mockResolvedValue({ id: "g1", year: 2026, finishedAt: null, wishlistsEnabled: true });
  mockDb.group.update.mockImplementation(async ({ data }) => ({ id: "g1", ...data }));
  mockDb.person.findFirst.mockResolvedValue({ id: "p1" });
  mockDb.assignment.findMany.mockResolvedValue([pair]);
  mockDb.assignment.count.mockResolvedValue(2);
  mockDb.$transaction.mockImplementation(callback => callback(mockDb));
});

test("even the administrator receives only givers before finalization, with no receiver fields", async () => {
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ finishedAt: null, assignments: [{ id: pair.id, giver: { name: "Ana Silva" } }] });
  expect(mockDb.assignment.findMany.mock.calls[0][0].select).toEqual({ id: true, giver: { select: { name: true } } });
  expect(response.headers.get("Cache-Control")).toBe("no-store");
});

test("approved members cannot obtain the collective result before finalization", async () => {
  Object.assign(mockSession, { isAdmin: false, isLoggedIn: true, personId: "p1", groupId: "g1" });
  expect((await GET(request())).status).toBe(403);
  expect(mockDb.assignment.findMany).not.toHaveBeenCalled();
});

test.each(["anonymous", "other-group", "unapproved"])("%s visitors cannot see finalized results", async kind => {
  mockDb.group.findUnique.mockResolvedValue({ finishedAt, wishlistsEnabled: true });
  Object.assign(mockSession, { isAdmin: false, isLoggedIn: kind !== "anonymous", personId: "p1", groupId: kind === "other-group" ? "g2" : "g1" });
  if (kind === "unapproved") mockDb.person.findFirst.mockResolvedValue(null);
  expect((await GET(request())).status).toBe(403);
  expect(mockDb.assignment.findMany).not.toHaveBeenCalled();
});

test("finalization releases names to approved members without accounts or other people's wishes", async () => {
  mockDb.group.findUnique.mockResolvedValue({ finishedAt, wishlistsEnabled: true });
  Object.assign(mockSession, { isAdmin: false, isLoggedIn: true, personId: "p1", groupId: "g1" });
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ finishedAt: finishedAt.toISOString(), assignments: [{ id: pair.id, giver: { name: "Ana Silva" }, receiver: { name: "Bia Silva" } }] });
  expect(mockDb.person.findFirst.mock.calls[0][0].where).toEqual({ id: "p1", groupId: "g1", status: "APPROVED" });
});

test("the administrator can finalize a drawn group and the state is persisted atomically", async () => {
  const response = await finishRequest();
  expect(response.status).toBe(200);
  expect((await response.json()).finishedAt).toBeTruthy();
  expect(mockDb.group.update).toHaveBeenCalledWith({ where: { id: "g1" }, data: { finishedAt: expect.any(Date) } });
  expect(mockDb.assignment.count).toHaveBeenCalledWith({ where: { groupId: "g1", year: 2026 } });
  expect(mockDb.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
});

test("final results keep the group's year when accessed in a later calendar year", async () => {
  jest.useFakeTimers({ now: new Date("2027-01-10T12:00:00Z") });
  try {
    mockDb.group.findUnique.mockResolvedValue({ id: "g1", year: 2026, finishedAt, wishlistsEnabled: false });
    expect((await GET(request())).status).toBe(200);
    expect(mockDb.assignment.findMany.mock.calls[0][0].where).toEqual({ groupId: "g1", year: 2026 });
  } finally { jest.useRealTimers(); }
});

test("finalizing twice preserves the original finalization time", async () => {
  mockDb.group.findUnique.mockResolvedValue({ id: "g1", finishedAt });
  expect((await (await finishRequest()).json()).finishedAt).toBe(finishedAt.toISOString());
  expect(mockDb.group.update).not.toHaveBeenCalled();
});

test.each([false, true])("only the group's administrator can finalize (admin=%j)", async isAdmin => {
  Object.assign(mockSession, { isAdmin, adminGroupId: "other-group" });
  expect((await finishRequest()).status).toBe(403);
  expect(mockDb.$transaction).not.toHaveBeenCalled();
});

test("a group without a draw cannot be finalized", async () => {
  mockDb.assignment.count.mockResolvedValue(0);
  expect((await finishRequest()).status).toBe(409);
  expect(mockDb.group.update).not.toHaveBeenCalled();
});

test("a finalized draw cannot be deleted or redrawn", async () => {
  mockDb.group.findUnique.mockResolvedValue({ id: "g1", finishedAt });
  expect((await DELETE(request("DELETE"))).status).toBe(409);
  expect((await generate(request("POST", { groupId: "g1" }))).status).toBe(400);
  expect(mockDb.assignment.deleteMany).not.toHaveBeenCalled();
  expect(mockDb.assignment.create).not.toHaveBeenCalled();
});

test("an unfinished draw can still be deleted to allow corrections", async () => {
  expect((await DELETE(request("DELETE"))).status).toBe(200);
  expect(mockDb.assignment.deleteMany).toHaveBeenCalled();
});

test("generating a draw never returns the confidential pairs", async () => {
  mockDb.assignment.count.mockResolvedValue(0);
  mockDb.person.findMany.mockResolvedValue([{ id: "p1", name: "Ana Silva" }, { id: "p2", name: "Bia Silva" }]);
  mockDb.assignment.create.mockResolvedValue(pair);
  const response = await generate(request("POST", { groupId: "g1" }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ count: 2 });
});
