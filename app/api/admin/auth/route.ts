import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";
import { adminAuthRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = adminAuthRateLimit(request);
    if (!rateLimitResult.success) return rateLimitResult.response!;

    const { password, groupId } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "A senha é obrigatória" }, { status: 400 });
    }

    if (!groupId) {
      return NextResponse.json({ error: "O identificador do grupo é obrigatório" }, { status: 400 });
    }

    // Get admin config for this group
    const adminConfig = await prisma.adminConfig.findUnique({
      where: { groupId },
      include: { group: true, person: true },
    });

    if (!adminConfig) {
      // Use same error message to prevent enumeration
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const session = await getSession();
    if (adminConfig.userId && adminConfig.userId !== session.userId) return NextResponse.json({ error: "Entre com o e-mail e a senha da conta que administra este grupo" }, { status: 401 });

    // Verify password
    const isValid = await bcrypt.compare(password, adminConfig.hashedPassword);

    if (!isValid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    // Set server-side admin session
    if (session.userId && !adminConfig.userId) {
      if (adminConfig.person?.userId && adminConfig.person.userId !== session.userId) return NextResponse.json({ error: "A participação deste administrador já pertence a outra conta" }, { status: 409 });
      await prisma.$transaction(async tx => {
        await tx.adminConfig.updateMany({ where: { groupId, userId: null }, data: { userId: session.userId } });
        if (adminConfig.person) await tx.person.updateMany({ where: { id: adminConfig.person.id, userId: null }, data: { userId: session.userId } });
      }, { isolationLevel: "Serializable" });
    }
    session.isAdmin = true;
    session.adminGroupId = adminConfig.group.id;
    session.adminGroupName = adminConfig.group.name;
    session.adminInviteCode = adminConfig.group.inviteCode;
    session.adminPersonId = adminConfig.person?.id;
    session.personId = adminConfig.person?.id;
    session.personName = adminConfig.person?.name;
    session.groupId = adminConfig.person ? adminConfig.group.id : undefined;
    session.groupName = adminConfig.person ? adminConfig.group.name : undefined;
    session.loginMethod = adminConfig.person ? "admin" : undefined;
    session.isLoggedIn = Boolean(adminConfig.person);
    await session.save();

    return NextResponse.json({
      success: true,
      group: {
        id: adminConfig.group.id,
        name: adminConfig.group.name,
        inviteCode: adminConfig.group.inviteCode,
        year: adminConfig.group.year,
      },
    });
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
