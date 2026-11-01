import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { clearGroupSession } from "@/lib/accounts";
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Entre na sua conta" }, { status: 401 });
  const group = await prisma.group.findFirst({ where: { id: params.id, OR: [{ people: { some: { userId: session.userId, status: "APPROVED" } } }, { adminConfig: { userId: session.userId } }] }, include: { people: { where: { userId: session.userId, status: "APPROVED" } }, adminConfig: true } });
  if (!group) return NextResponse.json({ error: "Você ainda não tem acesso a este grupo" }, { status: 403 });
  clearGroupSession(session);
  const person = group.people[0];
  if (person) {
    session.personId = person.id; session.personName = person.name;
    session.groupId = group.id; session.groupName = group.name;
    session.isLoggedIn = true; session.loginMethod = "account";
  }
  if (group.adminConfig?.userId === session.userId) {
    session.isAdmin = true; session.adminGroupId = group.id; session.adminGroupName = group.name;
    session.adminInviteCode = group.inviteCode; session.adminPersonId = group.adminConfig.personId ?? undefined;
  }
  await session.save();
  return NextResponse.json({ isAdmin: session.isAdmin, isLoggedIn: session.isLoggedIn });
}
