import { NextRequest } from "next/server";
import type { SessionData } from "@/lib/session";
const mockDb = { person: { findFirst: jest.fn(), findMany: jest.fn() } };
const mockSession: SessionData = {};
jest.mock("@/lib/db", () => ({ prisma: mockDb }));
jest.mock("@/lib/session", () => ({ getSession: async () => mockSession }));
import { GET } from "@/app/api/groups/[id]/participants/route";
const get = (id = "group-1") => GET(new NextRequest(`http://localhost:3000/api/groups/${id}/participants`), { params: { id } });
beforeEach(() => {
  jest.resetAllMocks();
  for (const key of Object.keys(mockSession)) delete (mockSession as Record<string, unknown>)[key];
  Object.assign(mockSession, { userId: "user-1", isLoggedIn: true, personId: "person-1", groupId: "group-1" });
  mockDb.person.findFirst.mockResolvedValue({ id: "person-1" });
  mockDb.person.findMany.mockResolvedValue([
    { id: "person-1", name: "Ana Silva", adminFor: null, userId: "private-user", status: "APPROVED", email: "private@example.com", wishlistItems: [{ title: "Private gift" }] },
    { id: "person-2", name: "João Silva", adminFor: { groupId: "group-1" } },
  ]);
});
test("approved members see the names of approved participants and the administrator", async () => {
  const response = await get();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ participants: [{ id: "person-1", name: "Ana Silva", isAdmin: false }, { id: "person-2", name: "João Silva", isAdmin: true }] });
  expect(mockDb.person.findFirst).toHaveBeenCalledWith({ where: { id: "person-1", groupId: "group-1", status: "APPROVED" }, select: { id: true } });
  expect(mockDb.person.findMany).toHaveBeenCalledWith({ where: { groupId: "group-1", status: "APPROVED" }, select: { id: true, name: true, adminFor: { select: { groupId: true } } }, orderBy: { name: "asc" } });
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
});
test("anonymous visitors cannot enumerate group members", async () => {
  Object.assign(mockSession, { userId: undefined, isLoggedIn: false });
  expect((await get()).status).toBe(401);
  expect(mockDb.person.findMany).not.toHaveBeenCalled();
});
test("an account without approved participation cannot see the list", async () => {
  mockSession.isLoggedIn = false;
  expect((await get()).status).toBe(403);
  expect(mockDb.person.findMany).not.toHaveBeenCalled();
});
test.each(["PENDING", "REJECTED", "REMOVED"])("a stale signed session cannot read names after its membership becomes %s", async () => {
  mockDb.person.findFirst.mockResolvedValue(null);
  expect((await get()).status).toBe(403);
  expect(mockDb.person.findMany).not.toHaveBeenCalled();
});
test("members cannot read participants from a different group", async () => {
  expect((await get("other-group")).status).toBe(403);
  expect(mockDb.person.findFirst).not.toHaveBeenCalled();
  expect(mockDb.person.findMany).not.toHaveBeenCalled();
});
test("a non-participating administrator can read the approved roster of their own group", async () => {
  Object.assign(mockSession, { isAdmin: true, adminGroupId: "group-1", isLoggedIn: false, personId: undefined });
  expect((await get()).status).toBe(200);
  expect(mockDb.person.findFirst).not.toHaveBeenCalled();
  expect(mockDb.person.findMany.mock.calls[0][0].where).toEqual({ groupId: "group-1", status: "APPROVED" });
});
test("administrator access does not extend to other groups", async () => {
  Object.assign(mockSession, { isAdmin: true, adminGroupId: "other-group", isLoggedIn: false });
  expect((await get()).status).toBe(403);
  expect(mockDb.person.findMany).not.toHaveBeenCalled();
});
