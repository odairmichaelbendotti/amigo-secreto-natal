import { NextRequest } from "next/server";
import type { SessionData } from "@/lib/session";
const mockDb = {
  group: { findUnique: jest.fn(), update: jest.fn() },
  person: { findUnique: jest.fn(), findMany: jest.fn() },
  assignment: { findMany: jest.fn() },
  wishlistItem: { deleteMany: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(),
};
const mockSession: SessionData = {};
jest.mock("@/lib/db", () => ({ prisma: mockDb }));
jest.mock("@/lib/session", () => ({ getSession: async () => mockSession }));
import { PATCH as updateGroup } from "@/app/api/groups/[id]/route";
import { GET as personalData } from "@/app/api/auth/person-data/route";
import { GET as assignments } from "@/app/api/assignments/route";
import { POST as saveWishlist } from "@/app/api/wishlist/route";
import { GET as listPeople } from "@/app/api/people/route";
const params = { params: { id: "group-1" } };
const item = { id: "item-1", title: "Livro", link: "https://example.com/livro", order: 0 };
const pair = { id: "pair-1", giver: { name: "Ana Silva" }, receiver: { name: "Bia Silva", wishlistItems: [item] } };
const request = (body: object) => new NextRequest("http://localhost:3000/api/groups/group-1", { method: "PATCH", body: JSON.stringify(body) });
function person(enabled: boolean) {
  return { id: "person-1", groupId: "group-1", status: "APPROVED", group: { wishlistsEnabled: enabled }, wishlistItems: [item], giverFor: [pair] };
}
beforeEach(() => {
  jest.resetAllMocks();
  mockDb.$transaction.mockImplementation(callback => callback(mockDb));
  Object.assign(mockSession, { isAdmin: true, adminGroupId: "group-1", isLoggedIn: true, personId: "person-1", groupId: "group-1" });
  mockDb.group.findUnique.mockResolvedValue({ id: "group-1", wishlistsEnabled: true });
  mockDb.group.update.mockImplementation(async ({ data }) => ({ id: "group-1", budgetAmount: 75, budgetCurrency: "BRL", ...data }));
  mockDb.person.findUnique.mockResolvedValue(person(true));
  mockDb.assignment.findMany.mockResolvedValue([pair]);
  mockDb.wishlistItem.create.mockResolvedValue(item);
});
test.each([false, true])("administrator can set wishlist visibility to %j without changing the budget or deleting wishes", async wishlistsEnabled => {
  const response = await updateGroup(request({ wishlistsEnabled }), params);
  expect(response.status).toBe(200);
  expect(mockDb.group.update).toHaveBeenCalledWith({ where: { id: "group-1" }, data: { wishlistsEnabled, updatedAt: expect.any(Date) } });
  expect((await response.json()).group).toMatchObject({ wishlistsEnabled, budgetAmount: 75, budgetCurrency: "BRL" });
  expect(mockDb.wishlistItem.deleteMany).not.toHaveBeenCalled();
});
test("updating the budget preserves wishlist visibility", async () => {
  expect((await updateGroup(request({ budgetAmount: 50, budgetCurrency: "BRL" }), params)).status).toBe(200);
  expect(mockDb.group.update.mock.calls[0][0].data).not.toHaveProperty("wishlistsEnabled");
});
test.each(["false", null, 0])("rejects invalid visibility values: %j", async wishlistsEnabled => {
  expect((await updateGroup(request({ wishlistsEnabled }), params)).status).toBe(400);
  expect(mockDb.group.update).not.toHaveBeenCalled();
});
test("participants and administrators of other groups cannot change visibility", async () => {
  mockSession.isAdmin = false;
  expect((await updateGroup(request({ wishlistsEnabled: false }), params)).status).toBe(403);
  mockSession.isAdmin = true; mockSession.adminGroupId = "another-group";
  expect((await updateGroup(request({ wishlistsEnabled: false }), params)).status).toBe(403);
  expect(mockDb.group.update).not.toHaveBeenCalled();
});
test("hidden lists are omitted from participant data while the drawn person's name remains visible", async () => {
  mockDb.person.findUnique.mockResolvedValue(person(false));
  const response = await personalData(); const data = await response.json();
  expect(response.status).toBe(200);
  expect(data).toMatchObject({ wishlistsEnabled: false, wishlistItems: [], assignment: { receiver: { name: "Bia Silva", wishlistItems: [] } } });
  expect(JSON.stringify(data)).not.toContain(item.link);
});
test("enabled lists remain available to their owner and their giver", async () => {
  const data = await (await personalData()).json();
  expect(data.wishlistsEnabled).toBe(true); expect(data.wishlistItems).toEqual([item]); expect(data.assignment.receiver.wishlistItems).toEqual([item]);
});
test.each([false, true])("final administrator results follow wishlist visibility %j", async wishlistsEnabled => {
  mockDb.group.findUnique.mockResolvedValue({ wishlistsEnabled, finishedAt: new Date() });
  const response = await assignments(new NextRequest("http://localhost:3000/api/assignments?groupId=group-1"));
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.assignments[0].receiver.name).toBe("Bia Silva");
  expect(data.assignments[0].receiver.wishlistItems).toEqual(wishlistsEnabled ? [item] : []);
});
test("a stale participant form cannot replace saved wishes when lists are hidden", async () => {
  mockDb.person.findUnique.mockResolvedValue(person(false));
  const response = await saveWishlist(request({ personId: "person-1", items: [{ title: "Outro livro", link: "https://example.com/outro" }] }));
  expect(response.status).toBe(403); expect((await response.json()).error).toContain("ocultas");
  expect(mockDb.wishlistItem.deleteMany).not.toHaveBeenCalled(); expect(mockDb.wishlistItem.create).not.toHaveBeenCalled();
});
test("participants can save their suggestions when enabled", async () => {
  expect((await saveWishlist(request({ personId: "person-1", items: [{ title: item.title, link: item.link }] }))).status).toBe(200);
  expect(mockDb.wishlistItem.create).toHaveBeenCalledTimes(1);
});

test("a wish only needs its name, with whitespace trimmed and no price or link", async () => {
  const response = await saveWishlist(request({ personId: "person-1", items: [{ title: "  Chocolate amargo  " }] }));
  expect(response.status).toBe(200);
  expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
  expect(mockDb.wishlistItem.create).toHaveBeenCalledWith({ data: { personId: "person-1", title: "Chocolate amargo", link: "", order: 0 } });
});

test("a participant can remove every wish", async () => {
  const response = await saveWishlist(request({ personId: "person-1", items: [] }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ wishlistItems: [] });
  expect(mockDb.wishlistItem.deleteMany).toHaveBeenCalledWith({ where: { personId: "person-1" } });
  expect(mockDb.wishlistItem.create).not.toHaveBeenCalled();
});

test.each([null, 10, "Chocolate", {}, { title: " " }, { title: 12 }, { title: "Presente", link: 12 }])("malformed wishes are rejected before deleting any saved items: %j", item => {
  return saveWishlist(request({ personId: "person-1", items: [item] })).then(response => {
    expect(response.status).toBe(400);
    expect(mockDb.$transaction).not.toHaveBeenCalled();
    expect(mockDb.wishlistItem.deleteMany).not.toHaveBeenCalled();
  });
});

test("a participant cannot change anyone else's wishes", async () => {
  expect((await saveWishlist(request({ personId: "someone-else", items: [{ title: "Chocolate" }] }))).status).toBe(403);
  expect(mockDb.$transaction).not.toHaveBeenCalled();
});

test.each([false, true])("the administrator's participant table respects wishlist visibility %j", async wishlistsEnabled => {
  mockDb.person.findMany.mockResolvedValue([{ id: "person-1", name: "Ana Silva", group: { wishlistsEnabled }, wishlistItems: [item], _count: { wishlistItems: 1 } }]);
  const response = await listPeople(new NextRequest("http://localhost/api/people?groupId=group-1"));
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.people[0].wishlistItems).toEqual(wishlistsEnabled ? [item] : []);
  expect(data.people[0]).not.toHaveProperty("group");
});
