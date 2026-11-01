import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { joinRateLimit } from "@/lib/rate-limit";
import { requestMembership, accountErrorResponse } from "@/lib/accounts";

export async function POST(request: NextRequest) {
  try {
    const limit = joinRateLimit(request);
    if (!limit.success) return limit.response!;
    const session = await getSession();
    const user = session.userId ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;
    if (!user) return NextResponse.json({ error: "Entre ou crie sua conta para participar" }, { status: 401 });
    const { inviteCode } = await request.json();
    const person = await prisma.$transaction(tx => requestMembership(tx, user, inviteCode), { isolationLevel: "Serializable" });
    return NextResponse.json({ person: { id: person.id, name: person.name, status: person.status } });
  } catch (error) {
    const result = accountErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
