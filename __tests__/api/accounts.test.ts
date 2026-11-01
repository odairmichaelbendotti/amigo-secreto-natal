import { NextRequest } from "next/server";
import type { SessionData } from "@/lib/session";
const mockDb = {
  user: { findUnique: jest.fn(), create: jest.fn() },
  group: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  person: { findUnique: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
  adminConfig: { create: jest.fn(), updateMany: jest.fn() },
  assignment: { count: jest.fn() },
  $transaction: jest.fn(),
};
const mockSession: SessionData & { save: jest.Mock } = { save: jest.fn() };
const mockHash = jest.fn(); const mockCompare = jest.fn();
jest.mock("@/lib/db", () => ({ prisma: mockDb }));
jest.mock("@/lib/session", () => ({ getSession: async () => mockSession }));
jest.mock("bcryptjs", () => ({ __esModule: true, default: { hash: mockHash, compare: mockCompare } }));
jest.mock("@/lib/rate-limit", () => ({ authRateLimit: () => ({ success: true }), joinRateLimit: () => ({ success: true }) }));
jest.mock("@/lib/utils", () => ({ generateGroupInviteCode: () => "ABC123" }));
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as join } from "@/app/api/join/request/route";
import { POST as create } from "@/app/api/groups/create/route";
import { POST as select } from "@/app/api/groups/[id]/select/route";
import { GET as groups } from "@/app/api/account/groups/route";
const user = { id: "user-1", name: "Larissa Paixão", email: "larissa@example.com", passwordHash: "hashed" };
const group = { id: "group-1", name: "Bendotti", year: 2026, inviteCode: "ABC123" };
const person = { id: "person-1", name: user.name, groupId: group.id, userId: user.id, status: "PENDING" };
const post = (body: object) => new NextRequest("http://localhost:3000/api", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => {
  jest.resetAllMocks(); for (const key of Object.keys(mockSession)) if (key !== "save") delete (mockSession as unknown as Record<string, unknown>)[key];
  mockDb.$transaction.mockImplementation(cb => cb(mockDb));
  mockDb.user.findUnique.mockResolvedValue(user); mockDb.user.create.mockResolvedValue(user);
  mockDb.group.findUnique.mockResolvedValue(group); mockDb.person.findUnique.mockResolvedValue(null);
  mockDb.person.create.mockResolvedValue(person); mockDb.person.updateMany.mockResolvedValue({ count: 1 });
  mockDb.assignment.count.mockResolvedValue(0); mockHash.mockResolvedValue("hashed"); mockCompare.mockResolvedValue(true);
});
test.each(["1234", "abcd", "!!!!", "    "])("registers with any password of four characters: %j", async password => {
  const response = await register(post({ name: "  Larissa   Paixão ", email: " LARISSA@EXAMPLE.COM ", password, inviteCode: "ABC123" }));
  expect(response.status).toBe(201);
  expect(mockHash).toHaveBeenCalledWith(password, 12);
  expect(mockDb.user.create).toHaveBeenCalledWith({ data: { name: user.name, email: user.email, passwordHash: "hashed" } });
  expect(mockDb.person.create).toHaveBeenCalledWith({ data: { groupId: group.id, userId: user.id, name: user.name, status: "PENDING" } });
  expect(mockSession.userId).toBe(user.id); expect(mockSession.isLoggedIn).toBe(false);
  expect(await response.json()).toEqual({ user: { id: user.id, name: user.name, email: user.email } });
});
test.each([{ name: "Larissa" }, { email: "invalid" }, { password: "123" }, { password: "a".repeat(73) }])("rejects invalid registration: %j", async override => {
  const response = await register(post({ name: user.name, email: user.email, password: "1234", ...override }));
  expect(response.status).toBe(400); expect(mockDb.user.create).not.toHaveBeenCalled();
});
test("duplicate email does not authenticate or reveal passwords", async () => {
  mockDb.user.create.mockRejectedValue({ code: "P2002" });
  const response = await register(post({ name: user.name, email: user.email, password: "1234" }));
  expect(response.status).toBe(409); expect(mockSession.userId).toBeUndefined(); expect(mockSession.save).not.toHaveBeenCalled();
});
test("a signed legacy request is linked without recreating it", async () => {
  Object.assign(mockSession, { pendingPersonId: person.id, pendingGroupId: group.id });
  mockDb.person.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(person);
  expect((await register(post({ name: user.name, email: user.email, password: "1234", inviteCode: "ABC123" }))).status).toBe(201);
  expect(mockDb.person.updateMany).toHaveBeenCalledWith({ where: { id: person.id, groupId: group.id, userId: null }, data: { userId: user.id } });
  expect(mockDb.person.create).not.toHaveBeenCalled();
});
test("supplied person IDs and names cannot claim another legacy membership", async () => {
  await register(post({ name: user.name, email: user.email, password: "1234", personId: "someone-else", inviteCode: "ABC123" }));
  expect(mockDb.person.updateMany).not.toHaveBeenCalled(); expect(mockDb.person.create).toHaveBeenCalledTimes(1);
});
test("email/password login restores the account and clears another group's roles", async () => {
  Object.assign(mockSession, { userId: "other", isAdmin: true, adminGroupId: "old", isLoggedIn: true, personId: "old" });
  const response = await login(post({ email: " LARISSA@EXAMPLE.COM ", password: "1234" }));
  expect(response.status).toBe(200); expect(mockCompare).toHaveBeenCalledWith("1234", "hashed");
  expect(mockSession).toMatchObject({ userId: user.id, isAdmin: false, isLoggedIn: false }); expect(mockSession.personId).toBeUndefined();
  expect(mockDb.person.updateMany).not.toHaveBeenCalled();
});
test.each([null, "bad-password"])("invalid credentials do not create a session: %j", async value => {
  if (!value) mockDb.user.findUnique.mockResolvedValue(null); else mockCompare.mockResolvedValue(false);
  expect((await login(post({ email: user.email, password: value || "1234" }))).status).toBe(401);
  expect(mockSession.save).not.toHaveBeenCalled();
});
test("old personal codes no longer authenticate", async () => {
  expect((await login(post({ groupId: group.id, loginCode: "OLD-CODE" }))).status).toBe(401);
});
test.each(["PENDING", "APPROVED", "REJECTED"])("repeated join preserves %s membership", async status => {
  mockSession.userId = user.id; mockDb.person.findUnique.mockResolvedValue({ ...person, status });
  const response = await join(post({ inviteCode: "ABC123", status: "APPROVED", name: "Fake Name" }));
  expect(response.status).toBe(200); expect((await response.json()).person.status).toBe(status);
  expect(mockDb.person.create).not.toHaveBeenCalled();
});
test("new requests require an account and remain pending", async () => {
  expect((await join(post({ inviteCode: "ABC123" }))).status).toBe(401);
  mockSession.userId = user.id;
  expect((await join(post({ inviteCode: "ABC123", status: "APPROVED" }))).status).toBe(200);
  expect(mockDb.person.create.mock.calls[0][0].data).toMatchObject({ userId: user.id, status: "PENDING" });
});
test("new memberships cannot enter an already drawn group", async () => {
  mockSession.userId = user.id; mockDb.assignment.count.mockResolvedValue(3);
  expect((await join(post({ inviteCode: "ABC123" }))).status).toBe(409);
});
test("Meus grupos scopes memberships and administration to the account", async () => {
  mockSession.userId = user.id;
  mockDb.group.findMany.mockResolvedValue([{ ...group, people: [{ status: "APPROVED" }], adminConfig: null }, { ...group, id: "group-2", people: [], adminConfig: { userId: user.id } }]);
  const response = await groups(); const data = await response.json();
  expect(response.status).toBe(200); expect(data.groups).toHaveLength(2);
  expect(data.groups[1]).toMatchObject({ isAdmin: true, status: null });
  expect(mockDb.group.findMany.mock.calls[0][0].where.OR).toEqual([{ people: { some: { userId: user.id } } }, { adminConfig: { userId: user.id } }]);
  expect(JSON.stringify(data)).not.toContain("hashed"); expect(JSON.stringify(data)).not.toContain("inviteCode");
});
test("pending or foreign group cannot be selected", async () => {
  mockSession.userId = user.id; mockDb.group.findFirst.mockResolvedValue(null);
  expect((await select(post({}), { params: { id: group.id } })).status).toBe(403);
  expect(mockSession.isLoggedIn).toBeUndefined();
  expect(mockDb.group.findFirst.mock.calls[0][0].where.OR[0]).toEqual({ people: { some: { userId: user.id, status: "APPROVED" } } });
});
test("approved account selects a group from a fresh session without codes", async () => {
  mockSession.userId = user.id; mockDb.group.findFirst.mockResolvedValue({ ...group, people: [{ ...person, status: "APPROVED" }], adminConfig: { userId: "someone-else" } });
  expect((await select(post({}), { params: { id: group.id } })).status).toBe(200);
  expect(mockSession).toMatchObject({ isLoggedIn: true, isAdmin: false, personId: person.id, groupId: group.id, userId: user.id });
});
test.each([true, false])("group creation links account and respects admin participation %j", async adminParticipates => {
  mockSession.userId = user.id; mockDb.group.findUnique.mockResolvedValue(null);
  mockDb.group.create.mockResolvedValue({ ...group, people: adminParticipates ? [{ ...person, status: "APPROVED" }] : [] });
  const response = await create(post({ groupName: group.name, year: 2026, adminParticipates }));
  expect(response.status).toBe(201);
  expect(mockDb.adminConfig.create.mock.calls[0][0].data).toMatchObject({ userId: user.id, groupId: group.id });
  expect(mockSession.isAdmin).toBe(true); expect(mockSession.isLoggedIn).toBe(adminParticipates);
  expect(mockDb.group.create.mock.calls[0][0].data.people).toEqual(adminParticipates ? { create: { name: user.name, userId: user.id } } : undefined);
});
