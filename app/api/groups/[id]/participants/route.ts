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

    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { wishlistsEnabled: true } });
    if (!group) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });

    const people = await prisma.person.findMany({
      where: { groupId, status: "APPROVED" },
      select: {
        id: true, name: true, adminFor: { select: { groupId: true } },
        ...(group.wishlistsEnabled ? { wishlistItems: { select: { title: true, link: true }, orderBy: { order: "asc" as const } } } : {}),
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      wishlistsEnabled: group.wishlistsEnabled,
      participants: people.map(person => ({
        id: person.id, name: person.name, isAdmin: person.adminFor?.groupId === groupId,
        wishlistItems: group.wishlistsEnabled ? person.wishlistItems.map(item => ({ title: item.title, link: item.link })) : [],
      })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Error fetching group participants:", error);
    return NextResponse.json({ error: "Não foi possível carregar os participantes" }, { status: 500 });
  }
}
