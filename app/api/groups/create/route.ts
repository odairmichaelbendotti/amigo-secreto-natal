import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateGroupInviteCode } from "@/lib/utils";
import { clearGroupSession, accountErrorResponse, AccountError } from "@/lib/accounts";
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const user = session.userId ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;
    if (!user) throw new AccountError("Entre ou crie sua conta para criar um grupo", 401);
    const { groupName, year, adminParticipates = true } = await request.json();
    if (typeof groupName !== "string" || !groupName.trim() || groupName.trim().length > 120) throw new AccountError("Informe um nome de grupo com até 120 caracteres");
    if (typeof adminParticipates !== "boolean") throw new AccountError("Informe se deseja participar do sorteio");
    if (!Number.isInteger(year) || year < 2024 || year > 2100) throw new AccountError("Informe um ano válido");
    let inviteCode = generateGroupInviteCode();
    while (await prisma.group.findUnique({ where: { inviteCode } })) inviteCode = generateGroupInviteCode();
    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.group.create({ data: { name: groupName.trim(), inviteCode, year, people: adminParticipates ? { create: { name: user.name, userId: user.id } } : undefined }, include: { people: true } });
      await tx.adminConfig.create({ data: { groupId: created.id, userId: user.id, personId: created.people[0]?.id, hashedPassword: user.passwordHash } });
      return created;
    });
    clearGroupSession(session);
    session.isAdmin = true; session.adminGroupId = group.id; session.adminGroupName = group.name;
    session.adminInviteCode = group.inviteCode; session.adminPersonId = group.people[0]?.id;
    if (group.people[0]) {
      session.personId = group.people[0].id; session.personName = user.name;
      session.groupId = group.id; session.groupName = group.name;
      session.isLoggedIn = true; session.loginMethod = "admin";
    }
    await session.save();
    return NextResponse.json({ group: { id: group.id, name: group.name, inviteCode: group.inviteCode, year: group.year } }, { status: 201 });
  } catch (error) {
    const result = accountErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
