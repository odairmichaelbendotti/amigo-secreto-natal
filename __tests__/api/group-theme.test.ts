import { NextRequest } from "next/server";
import type { SessionData } from "@/lib/session";

const mockDb = { group: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() }, user: { findUnique: jest.fn() } };
const mockSession: SessionData = {};
jest.mock("@/lib/db", () => ({ prisma: mockDb }));
jest.mock("@/lib/session", () => ({ getSession: async () => mockSession }));
import { PATCH, GET } from "@/app/api/groups/[id]/route";
import { GET as myGroups } from "@/app/api/account/groups/route";

const params = { params: { id: "g1" } };
const patch = (body: object) => PATCH(new NextRequest("http://localhost:3000/api/groups/g1", { method: "PATCH", body: JSON.stringify(body) }), params);
beforeEach(() => {
  jest.resetAllMocks();
  for (const key of Object.keys(mockSession)) delete (mockSession as Record<string, unknown>)[key];
  Object.assign(mockSession, { userId: "u1", isAdmin: true, adminGroupId: "g1" });
  mockDb.group.update.mockImplementation(async ({ data }) => ({ id: "g1", theme: "none", wishlistsEnabled: false, budgetAmount: 75, finishedAt: null, ...data }));
});

test.each(["none", "fruits"])("the administrator can persist the %s theme without changing other settings", async theme => {
  const response = await patch({ theme });
  expect(response.status).toBe(200);
  expect(mockDb.group.update).toHaveBeenCalledWith({ where: { id: "g1" }, data: { theme, updatedAt: expect.any(Date) } });
  expect((await response.json()).group).toMatchObject({ theme, budgetAmount: 75, wishlistsEnabled: false, finishedAt: null });
});

test.each(["", "fruit", "unknown", "<svg onload=alert(1)>", null, 0, {}, []])("invalid themes cannot be saved: %j", async theme => {
  expect((await patch({ theme })).status).toBe(400);
  expect(mockDb.group.update).not.toHaveBeenCalled();
});

test.each([false, true])("members and administrators of other groups cannot change the theme (admin=%j)", async isAdmin => {
  Object.assign(mockSession, { isAdmin, adminGroupId: "g2" });
  expect((await patch({ theme: "fruits" })).status).toBe(403);
  expect(mockDb.group.update).not.toHaveBeenCalled();
});

test("other settings do not reset a previously chosen theme", async () => {
  expect((await patch({ budgetAmount: 50, budgetCurrency: "BRL" })).status).toBe(200);
  expect(mockDb.group.update.mock.calls[0][0].data).not.toHaveProperty("theme");
});

test("the selected group's details expose its saved theme", async () => {
  mockDb.group.findUnique.mockResolvedValue({ id: "g1", theme: "fruits" });
  const response = await GET(new NextRequest("http://localhost:3000/api/groups/g1"), params);
  expect(response.status).toBe(200);
  expect((await response.json()).group.theme).toBe("fruits");
});

test("Meus grupos returns the theme of each group within the account's memberships", async () => {
  mockDb.user.findUnique.mockResolvedValue({ id: "u1", name: "Ana Silva", email: "ana@example.com" });
  mockDb.group.findMany.mockResolvedValue([
    { id: "g1", name: "Família", year: 2026, theme: "fruits", people: [{ status: "APPROVED" }], adminConfig: { userId: "u1" } },
    { id: "g2", name: "Amigos", year: 2026, theme: "none", people: [{ status: "APPROVED" }], adminConfig: null },
  ]);
  const response = await myGroups();
  expect(response.status).toBe(200);
  expect((await response.json()).groups.map((group: { theme: string }) => group.theme)).toEqual(["fruits", "none"]);
  expect(mockDb.group.findMany.mock.calls[0][0]).toMatchObject({ where: { OR: [{ people: { some: { userId: "u1" } } }, { adminConfig: { userId: "u1" } }] }, select: { theme: true } });
});
