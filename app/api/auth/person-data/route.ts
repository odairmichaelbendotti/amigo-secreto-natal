import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.personId || !session.groupId) {
      return NextResponse.json({ error: "Você não está autenticado" }, { status: 401 });
    }

    const person = await prisma.person.findUnique({
      where: { id: session.personId, groupId: session.groupId, status: "APPROVED" },
      include: {
        group: { select: { wishlistsEnabled: true } },
        wishlistItems: {
          orderBy: { order: "asc" },
        },
        giverFor: {
          include: {
            receiver: {
              include: {
                wishlistItems: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
          where: {
            groupId: session.groupId,
            year: new Date().getFullYear(),
          },
        },
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Sua participação precisa ser aprovada pelo administrador" }, { status: 403 });
    }

    const wishlistsEnabled = person.group.wishlistsEnabled;
    const assignment = person.giverFor[0] || null;
    return NextResponse.json({
      wishlistsEnabled,
      wishlistItems: wishlistsEnabled ? person.wishlistItems : [],
      assignment: assignment ? {
        ...assignment,
        receiver: { ...assignment.receiver, wishlistItems: wishlistsEnabled ? assignment.receiver.wishlistItems : [] },
      } : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Person data error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
