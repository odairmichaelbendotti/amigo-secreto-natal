import { sealData } from "iron-session";
import type { SessionData } from "@/lib/session";

const mockDb = { user: { findUnique: jest.fn() }, person: { findFirst: jest.fn() } };
const mockCookies = { get: jest.fn(), set: jest.fn() };
jest.mock("@/lib/db", () => ({ prisma: mockDb }));
jest.mock("next/headers", () => ({ cookies: () => mockCookies }));
const secret = "session-test-only-secret-with-at-least-32-characters";
const user = { id: "u1", name: "Ana Silva", email: "ana@example.com" };
let get: typeof import("@/app/api/auth/session/route").GET;
let previousSecret: string | undefined;

beforeAll(async () => {
  previousSecret = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = secret;
  jest.resetModules();
  get = (await import("@/app/api/auth/session/route")).GET;
});
afterAll(() => {
  if (previousSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = previousSecret;
});
beforeEach(() => {
  jest.resetAllMocks();
  mockDb.user.findUnique.mockResolvedValue(user);
  mockDb.person.findFirst.mockResolvedValue({ id: "p1" });
});
async function cookie(data: SessionData, ttl = 86400) {
  const value = await sealData(data, { password: secret, ttl });
  mockCookies.get.mockImplementation((name: string) => name === "secret-santa-session" ? { value } : undefined);
}

test("a signed account cookie is recognized without selecting a group or being an approved participant", async () => {
  await cookie({ userId: user.id, isLoggedIn: false, isAdmin: false });
  const response = await get();
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ authenticated: true, user, isLoggedIn: false, isAdmin: false });
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mockDb.person.findFirst).not.toHaveBeenCalled();
});

test("without a session cookie the visitor is anonymous", async () => {
  const response = await get();
  expect(await response.json()).toEqual({ authenticated: false });
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mockDb.user.findUnique).not.toHaveBeenCalled();
});

test("a tampered cookie does not authenticate the visitor", async () => {
  mockCookies.get.mockReturnValue({ value: "invalid-session-cookie" });
  expect(await (await get()).json()).toEqual({ authenticated: false });
  expect(mockDb.user.findUnique).not.toHaveBeenCalled();
});

test("an expired signed cookie does not restore an old login", async () => {
  await cookie({ userId: user.id }, 60);
  jest.useFakeTimers({ now: Date.now() + 180000 });
  try {
    expect(await (await get()).json()).toEqual({ authenticated: false });
    expect(mockDb.user.findUnique).not.toHaveBeenCalled();
  } finally { jest.useRealTimers(); }
});

test("removing a group membership does not log the user out of their account", async () => {
  await cookie({ userId: user.id, isLoggedIn: true, personId: "p1", groupId: "g1" });
  mockDb.person.findFirst.mockResolvedValue(null);
  const response = await get();
  expect(await response.json()).toMatchObject({ authenticated: true, user, isLoggedIn: false });
  expect(mockCookies.set).toHaveBeenCalled();
});

test("a deleted account cannot reuse old group flags to remain logged in", async () => {
  await cookie({ userId: user.id, isAdmin: true, isLoggedIn: true, personId: "p1", groupId: "g1" });
  mockDb.user.findUnique.mockResolvedValue(null);
  expect(await (await get()).json()).toEqual({ authenticated: false });
  expect(mockDb.person.findFirst).not.toHaveBeenCalled();
  expect(mockCookies.set).toHaveBeenCalled();
});

test("a database failure is reported as unavailability and does not erase a valid login cookie", async () => {
  await cookie({ userId: user.id });
  mockDb.user.findUnique.mockRejectedValue(new Error("private database details"));
  const response = await get();
  expect(response.status).toBe(503);
  const data = await response.json();
  expect(data).toHaveProperty("error");
  expect(data).not.toHaveProperty("authenticated");
  expect(JSON.stringify(data)).not.toContain("private database details");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mockCookies.set).not.toHaveBeenCalled();
});
