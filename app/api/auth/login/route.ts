import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { authRateLimit } from "@/lib/rate-limit";
import { normalizeEmail, clearGroupSession, linkLegacySession, requestMembership, AccountError, accountErrorResponse } from "@/lib/accounts";

export async function POST(request: NextRequest) {
  try {
    const limit = authRateLimit(request);
    if (!limit.success) return limit.response!;
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (!user || typeof body.password !== "string" || Buffer.byteLength(body.password, "utf8") > 72 || !(await bcrypt.compare(body.password, user.passwordHash))) throw new AccountError("E-mail ou senha inválidos", 401);
    const session = await getSession();
    await prisma.$transaction(async (tx) => {
      await linkLegacySession(tx, session, user.id);
      if (body.inviteCode) await requestMembership(tx, user, body.inviteCode);
    }, { isolationLevel: "Serializable" });
    clearGroupSession(session);
    session.userId = user.id;
    await session.save();
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    const result = accountErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
