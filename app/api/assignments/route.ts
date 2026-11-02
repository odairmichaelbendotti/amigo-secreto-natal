import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET all assignments for a group and year
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const requestedYear = parseInt(searchParams.get("year") || "") || null;

    if (!groupId) {
      return NextResponse.json({ error: "O identificador do grupo é obrigatório" }, { status: 400 });
    }

    const isGroupAdmin = Boolean(session.isAdmin && session.adminGroupId === groupId);
    if (!isGroupAdmin) {
      const participant = session.isLoggedIn && session.personId && session.groupId === groupId
        ? await prisma.person.findFirst({ where: { id: session.personId, groupId, status: "APPROVED" }, select: { id: true } })
        : null;
      if (!participant) return NextResponse.json({ error: "É necessário participar deste grupo" }, { status: 403 });
    }
    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { wishlistsEnabled: true, finishedAt: true, year: true } });
    if (!group) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
    const year = requestedYear ?? group.year;
    if (!isGroupAdmin && !group.finishedAt) return NextResponse.json({ error: "O resultado completo será liberado quando o administrador finalizar o amigo secreto" }, { status: 403 });

    if (!group.finishedAt) {
      const assignments = await prisma.assignment.findMany({
        where: { groupId, year },
        select: { id: true, giver: { select: { name: true } } },
        orderBy: { giver: { name: "asc" } },
      });
      return NextResponse.json({ finishedAt: null, assignments: assignments.map(assignment => ({ id: assignment.id, giver: { name: assignment.giver.name } })) }, { headers: { "Cache-Control": "no-store" } });
    }

    const assignments = await prisma.assignment.findMany({
      where: { groupId, year },
      select: {
        id: true,
        giver: { select: { name: true } },
        receiver: { select: {
          name: true,
          wishlistItems: { select: { title: true, link: true }, orderBy: { order: "asc" } },
        } },
      },
      orderBy: { giver: { name: "asc" } },
    });

    return NextResponse.json({
      finishedAt: group.finishedAt || null,
      assignments: assignments.map(assignment => ({
        id: assignment.id,
        giver: { name: assignment.giver.name },
        receiver: { name: assignment.receiver.name, ...(isGroupAdmin ? { wishlistItems: group.wishlistsEnabled ? assignment.receiver.wishlistItems : [] } : {}) },
      })),
    }, { headers: { "Cache-Control": "no-store" } });
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
    const requestedYear = parseInt(searchParams.get("year") || "") || null;

    if (!groupId) {
      return NextResponse.json({ error: "O identificador do grupo é obrigatório" }, { status: 400 });
    }

    // Verify admin owns this group
    if (session.adminGroupId !== groupId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const deleted = await prisma.$transaction(async tx => {
      const group = await tx.group.findUnique({ where: { id: groupId }, select: { finishedAt: true, year: true } });
      if (!group || group.finishedAt) return false;
      await tx.assignment.deleteMany({ where: { groupId, year: requestedYear ?? group.year } });
      return true;
    }, { isolationLevel: "Serializable" });
    if (!deleted) return NextResponse.json({ error: "Um amigo secreto finalizado não pode ter seus resultados excluídos" }, { status: 409 });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") return NextResponse.json({ error: "O grupo foi atualizado. Tente novamente." }, { status: 409 });
    console.error("Error deleting assignments:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
