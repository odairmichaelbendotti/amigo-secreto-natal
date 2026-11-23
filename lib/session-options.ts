import type { SessionOptions } from "iron-session";

export const SESSION_DURATION_SECONDS = 60 * 24 * 60 * 60;

// Shared by route handlers and middleware, including the encrypted session TTL.
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "this-is-a-development-only-secret-that-must-be-changed",
  cookieName: "secret-santa-session",
  ttl: SESSION_DURATION_SECONDS,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  },
};
