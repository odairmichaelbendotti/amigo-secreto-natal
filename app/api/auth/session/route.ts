import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    const user = session.userId ? await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, name: true, email: true } }) : null;
    if (session.isLoggedIn && session.personId) {
      const person = await prisma.person.findFirst({ where: { id: session.personId, groupId: session.groupId, status: "APPROVED" }, select: { id: true } });
      if (!person) { session.isLoggedIn = false; await session.save(); }
    }

    if (!user && !session.isLoggedIn && !session.isAdmin) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user,
      personId: session.personId,
      personName: session.personName,
      groupId: session.groupId,
      groupName: session.groupName,
      loginMethod: session.loginMethod,
      isLoggedIn: session.isLoggedIn,
      isAdmin: session.isAdmin,
      adminGroupId: session.adminGroupId,
      adminGroupName: session.adminGroupName,
      adminInviteCode: session.adminInviteCode,
      adminPersonId: session.adminPersonId,
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ authenticated: false });
  }
}
