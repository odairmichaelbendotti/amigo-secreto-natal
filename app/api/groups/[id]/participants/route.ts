import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session.userId && !session.isLoggedIn && !session.isAdmin) {
      return NextResponse.json({ error: "Entre na sua conta para ver os participantes" }, { status: 401 });
    }

    const groupId = params.id;
    const isGroupAdmin = session.isAdmin && session.adminGroupId === groupId;
    if (!isGroupAdmin) {
      const participant = session.isLoggedIn && session.personId && session.groupId === groupId
        ? await prisma.person.findFirst({ where: { id: session.personId, groupId, status: "APPROVED" }, select: { id: true } })
        : null;
      if (!participant) return NextResponse.json({ error: "É necessário ter participação aprovada neste grupo" }, { status: 403 });
    }

    const people = await prisma.person.findMany({
      where: { groupId, status: "APPROVED" },
      select: { id: true, name: true, adminFor: { select: { groupId: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ participants: people.map(person => ({ id: person.id, name: person.name, isAdmin: person.adminFor?.groupId === groupId })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Error fetching group participants:", error);
    return NextResponse.json({ error: "Não foi possível carregar os participantes" }, { status: 500 });
  }
}
