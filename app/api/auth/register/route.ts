import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { authRateLimit } from "@/lib/rate-limit";
import { registrationData, linkLegacySession, requestMembership, clearGroupSession, accountErrorResponse, AccountError } from "@/lib/accounts";

export async function POST(request: NextRequest) {
  try {
    const limit = authRateLimit(request);
    if (!limit.success) return limit.response!;
    const session = await getSession();
    if (session.userId) throw new AccountError("Você já está conectado. Use sua conta para solicitar participação.", 409);
    const body = await request.json();
    const data = await registrationData(body);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data });
      await linkLegacySession(tx, session, created.id);
      if (body.inviteCode) await requestMembership(tx, created, body.inviteCode);
      return created;
    }, { isolationLevel: "Serializable" });
    clearGroupSession(session);
    session.userId = user.id;
    await session.save();
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    const result = accountErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
