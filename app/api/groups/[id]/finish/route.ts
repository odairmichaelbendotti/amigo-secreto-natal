import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

class FinishError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session.isAdmin || session.adminGroupId !== params.id) return NextResponse.json({ error: "É necessário administrar este grupo" }, { status: 403 });
    const group = await prisma.$transaction(async tx => {
      const current = await tx.group.findUnique({ where: { id: params.id } });
      if (!current) throw new FinishError("Grupo não encontrado", 404);
      if (current.finishedAt) return current;
      const count = await tx.assignment.count({ where: { groupId: params.id, year: current.year } });
      if (!count) throw new FinishError("Realize o sorteio antes de finalizar o amigo secreto", 409);
      return tx.group.update({ where: { id: params.id }, data: { finishedAt: new Date() } });
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ finishedAt: group.finishedAt }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof FinishError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") return NextResponse.json({ error: "O grupo foi atualizado. Tente finalizar novamente." }, { status: 409 });
    console.error("Error finishing secret santa:", error);
    return NextResponse.json({ error: "Não foi possível finalizar o amigo secreto" }, { status: 500 });
  }
}
