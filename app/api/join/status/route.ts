import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ person: null });
  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  const person = code ? await prisma.person.findFirst({ where: { userId: session.userId, group: { inviteCode: code } }, select: { id: true, name: true, status: true } }) : null;
  return NextResponse.json({ person }, { headers: { "Cache-Control": "no-store" } });
}
