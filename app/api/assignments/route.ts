import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET all assignments for a group and year
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isAdmin) return NextResponse.json({ error: "É necessário entrar como administrador" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const year = parseInt(searchParams.get("year") || "") || new Date().getFullYear();

    if (!groupId) {
      return NextResponse.json({ error: "O identificador do grupo é obrigatório" }, { status: 400 });
    }

    // Verify user has access to this group
    const userGroupId = session.isAdmin ? session.adminGroupId : session.groupId;
    if (userGroupId !== groupId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { wishlistsEnabled: true } });
    if (!group) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });

    const assignments = await prisma.assignment.findMany({
      where: { groupId, year },
      include: {
        giver: true,
        receiver: {
          include: {
            wishlistItems: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
      orderBy: { giver: { name: "asc" } },
    });

    return NextResponse.json({ assignments: group.wishlistsEnabled ? assignments : assignments.map(assignment => ({ ...assignment, receiver: { ...assignment.receiver, wishlistItems: [] } })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// DELETE all assignments for a group and year (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAdmin) {
      return NextResponse.json({ error: "É necessário entrar como administrador" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const year = parseInt(searchParams.get("year") || "") || new Date().getFullYear();

    if (!groupId) {
      return NextResponse.json({ error: "O identificador do grupo é obrigatório" }, { status: 400 });
    }

    // Verify admin owns this group
    if (session.adminGroupId !== groupId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.assignment.deleteMany({
      where: { groupId, year },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignments:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
