import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

class ReviewError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session.isAdmin || !session.adminGroupId) return NextResponse.json({ error: "É necessário entrar como administrador" }, { status: 403 });
    const { status } = await request.json();
    if (status !== "APPROVED" && status !== "REJECTED") return NextResponse.json({ error: "Decisão inválida" }, { status: 400 });
    const updated = await prisma.$transaction(async (tx) => {
      const person = await tx.person.findUnique({ where: { id: params.id }, include: { adminFor: { select: { id: true } } } });
      if (!person || person.groupId !== session.adminGroupId) throw new ReviewError("Solicitação não encontrada", 404);
      if (person.adminFor && status === "REJECTED") throw new ReviewError("O administrador deve gerenciar sua própria participação pelo painel", 400);
      if ((person.status === "APPROVED") !== (status === "APPROVED") && await tx.assignment.count({ where: { groupId: person.groupId } })) throw new ReviewError("O sorteio já foi realizado. Exclua os resultados antes de alterar os participantes.", 409);
      return tx.person.update({ where: { id: person.id }, data: { status } });
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ person: { id: updated.id, name: updated.name, status: updated.status } });
  } catch (error) {
    if (error instanceof ReviewError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") return NextResponse.json({ error: "O grupo foi atualizado. Tente avaliar a solicitação novamente." }, { status: 409 });
    console.error("Error reviewing participation:", error);
    return NextResponse.json({ error: "Não foi possível avaliar a solicitação" }, { status: 500 });
  }
}

// DELETE a person (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session.isAdmin) {
      return NextResponse.json({ error: "É necessário entrar como administrador" }, { status: 403 });
    }

    const { id } = params;

    // Verify the person belongs to the admin's group
    const person = await prisma.person.findUnique({
      where: { id },
      include: { adminFor: { select: { id: true } } },
    });
    if (!person) {
      return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
    }
    if (person.groupId !== session.adminGroupId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (person.adminFor) {
      return NextResponse.json({ error: "O administrador participa do sorteio e não pode ser removido do grupo" }, { status: 400 });
    }

    if (person.status === "APPROVED" && await prisma.assignment.count({ where: { groupId: person.groupId } })) return NextResponse.json({ error: "Exclua os resultados do sorteio antes de remover participantes" }, { status: 409 });

    await prisma.person.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting person:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
