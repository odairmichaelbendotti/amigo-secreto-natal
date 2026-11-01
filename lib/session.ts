import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export interface SessionData {
  userId?: string;
  personId?: string;
  personName?: string;
  groupId?: string;
  groupName?: string;
  loginMethod?: "account" | "request" | "admin";
  pendingPersonId?: string;
  pendingGroupId?: string;
  isLoggedIn?: boolean;
  // Admin session fields
  isAdmin?: boolean;
  adminGroupId?: string;
  adminGroupName?: string;
  adminInviteCode?: string;
  adminPersonId?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || "this-is-a-development-only-secret-that-must-be-changed",
  cookieName: "secret-santa-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getSessionFromRequest(
  req: NextRequest,
  res: NextResponse
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, sessionOptions);
}
