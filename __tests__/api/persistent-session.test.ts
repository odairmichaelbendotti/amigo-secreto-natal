import { NextRequest, NextResponse } from "next/server";
import type { SessionData } from "@/lib/session";

const mockDb = {
  user: { findUnique: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(),
};
const mockCookies = { get: jest.fn(), set: jest.fn() };
const mockCompare = jest.fn();
jest.mock("@/lib/db", () => ({ prisma: mockDb }));
jest.mock("next/headers", () => ({ cookies: () => mockCookies }));
jest.mock("bcryptjs", () => ({ __esModule: true, default: { hash: async () => "hashed", compare: mockCompare } }));
jest.mock("@/lib/rate-limit", () => ({ authRateLimit: () => ({ success: true }) }));

const secret = "persistent-session-test-secret-at-least-32-characters";
const user = { id: "u1", name: "Ana Silva", email: "ana@example.com", passwordHash: "hashed" };
const sixtyDays = 60 * 24 * 60 * 60;
let login: typeof import("@/app/api/auth/login/route").POST;
let register: typeof import("@/app/api/auth/register/route").POST;
let logout: typeof import("@/app/api/auth/logout/route").POST;
let getSession: typeof import("@/lib/session").getSession;
let getSessionFromRequest: typeof import("@/lib/session").getSessionFromRequest;
let middleware: typeof import("@/middleware").middleware;
let previousSecret: string | undefined;

beforeAll(async () => {
  previousSecret = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = secret;
  jest.resetModules();
  login = (await import("@/app/api/auth/login/route")).POST;
  register = (await import("@/app/api/auth/register/route")).POST;
  logout = (await import("@/app/api/auth/logout/route")).POST;
  ({ getSession, getSessionFromRequest } = await import("@/lib/session"));
  middleware = (await import("@/middleware")).middleware;
});

afterAll(() => {
  if (previousSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = previousSecret;
});

beforeEach(() => {
  jest.resetAllMocks();
  mockDb.user.findUnique.mockResolvedValue(user);
  mockDb.user.create.mockResolvedValue(user);
  mockDb.$transaction.mockImplementation(callback => callback(mockDb));
  mockCompare.mockResolvedValue(true);
  let value: string | undefined;
  mockCookies.get.mockImplementation(() => value ? { value } : undefined);
  mockCookies.set.mockImplementation((_name: string, seal: string, options: { maxAge: number }) => {
    value = options.maxAge === 0 ? undefined : seal;
  });
});

const credentials = () => new NextRequest("http://localhost/api/auth", {
  method: "POST",
  body: JSON.stringify({ name: user.name, email: user.email, password: "1234" }),
});

test.each(["login", "registration"])("%s creates a persistent cookie and restores the account through day 60", async mode => {
  const issuedAt = Date.now();
  const response = await (mode === "login" ? login : register)(credentials());
  expect(response.status).toBe(mode === "login" ? 200 : 201);
  expect(mockCookies.set).toHaveBeenCalledWith("secret-santa-session", expect.any(String), expect.objectContaining({
    maxAge: sixtyDays, httpOnly: true, sameSite: "lax", path: "/",
  }));
  const token = mockCookies.set.mock.calls[0][1];
  expect(token).not.toContain(user.passwordHash);
  expect(token).not.toContain(user.email);

  jest.useFakeTimers({ now: issuedAt + (sixtyDays - 1) * 1000 });
  try {
    // A fresh session read represents reopening the browser with its saved cookie.
    expect((await getSession()).userId).toBe(user.id);
    expect(mockCompare).toHaveBeenCalledTimes(mode === "login" ? 1 : 0);
    // Both session entry points must decrypt the same long-lived cookie.
    const request = new NextRequest("http://localhost/api/account/groups", {
      headers: { cookie: `secret-santa-session=${token}` },
    });
    expect((await getSessionFromRequest(request, NextResponse.next())).userId).toBe(user.id);

    // Include iron-session's 60-second clock tolerance when checking expiration.
    jest.setSystemTime(issuedAt + (sixtyDays + 120) * 1000);
    expect((await getSession()).userId).toBeUndefined();
    expect((await getSessionFromRequest(request, NextResponse.next())).userId).toBeUndefined();
  } finally { jest.useRealTimers(); }
});

test("middleware accepts a participant cookie after 59 days and rejects it after expiration", async () => {
  const issuedAt = Date.now();
  const session = await getSession();
  Object.assign(session, { userId: user.id, isLoggedIn: true, personId: "p1", groupId: "g1" } satisfies SessionData);
  await session.save();
  const token = mockCookies.set.mock.calls[0][1];
  const request = new NextRequest("http://localhost/api/wishlist", {
    method: "POST", headers: { cookie: `secret-santa-session=${token}` },
  });
  jest.useFakeTimers({ now: issuedAt + 59 * 24 * 60 * 60 * 1000 });
  try {
    expect((await middleware(request)).status).toBe(200);
    jest.setSystemTime(issuedAt + (sixtyDays + 120) * 1000);
    expect((await middleware(request)).status).toBe(401);
  } finally { jest.useRealTimers(); }
});

test("explicit logout deletes the persistent cookie and a fresh read is anonymous", async () => {
  await login(credentials());
  expect((await getSession()).userId).toBe(user.id);
  expect((await logout()).status).toBe(200);
  expect(mockCookies.set).toHaveBeenLastCalledWith("secret-santa-session", "", expect.objectContaining({ maxAge: 0 }));
  expect((await getSession()).userId).toBeUndefined();
});

test("invalid credentials never create a persistent cookie", async () => {
  mockCompare.mockResolvedValue(false);
  expect((await login(credentials())).status).toBe(401);
  expect(mockCookies.set).not.toHaveBeenCalled();
});
