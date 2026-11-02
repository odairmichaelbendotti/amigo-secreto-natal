import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSecretSantaAssignments } from "@/lib/secret-santa";
import { getSession } from "@/lib/session";
import { getDrawBlockReason } from "@/lib/draw-rules";

class DrawError extends Error {}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const { groupId, year } = await request.json();
    if (!session.isAdmin || !groupId || session.adminGroupId !== groupId) return NextResponse.json({ error: "É necessário administrar este grupo" }, { status: 403 });
    const assignments = await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({ where: { id: groupId }, select: { finishedAt: true, year: true } });
      if (!group) throw new DrawError("Grupo não encontrado");
      if (group.finishedAt) throw new DrawError("Este amigo secreto já foi finalizado. Crie um novo grupo para realizar outro sorteio.");
      if (year !== undefined && year !== group.year) throw new DrawError("O ano do sorteio deve ser o mesmo do grupo");
      const currentYear = group.year;
      if (await tx.assignment.count({ where: { groupId, year: currentYear } })) throw new DrawError("O sorteio deste ano já foi realizado. Exclua os resultados antes de realizar um novo sorteio.");
      const people = await tx.person.findMany({ where: { groupId, status: "APPROVED" }, select: { id: true, name: true } });
      const blockReason = getDrawBlockReason(people.length);
      if (blockReason) throw new DrawError(blockReason);
      const pairs = generateSecretSantaAssignments(people);
      if (!pairs) throw new DrawError("Não foi possível realizar um sorteio válido");
      return Promise.all(pairs.map((pair) => tx.assignment.create({ data: { groupId, giverId: pair.giverId, receiverId: pair.receiverId, year: currentYear }, select: { id: true } })));
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ count: assignments.length });
  } catch (error) {
    if (error instanceof DrawError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") return NextResponse.json({ error: "O grupo foi atualizado durante o sorteio. Tente novamente." }, { status: 409 });
    console.error("Error generating assignments:", error);
    return NextResponse.json({ error: "Não foi possível realizar o sorteio" }, { status: 500 });
  }
}
