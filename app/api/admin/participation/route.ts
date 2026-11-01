import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

class ParticipationError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isAdmin || !session.adminGroupId) {
      return NextResponse.json({ error: "É necessário entrar como administrador" }, { status: 403 });
    }

    const { name, personId } = await request.json();
    if (personId !== undefined && (typeof personId !== "string" || !personId)) {
      return NextResponse.json({ error: "Selecione um participante válido" }, { status: 400 });
    }
    const groupId = session.adminGroupId;
    const result = await prisma.$transaction(async (tx) => {
      const config = await tx.adminConfig.findUnique({ where: { groupId }, include: { group: true, person: true } });
      if (!config) throw new ParticipationError("Grupo não encontrado", 404);
      if (config.person) {
        if (session.userId && config.person.userId && config.person.userId !== session.userId) throw new ParticipationError("Este participante pertence a outra conta", 409);
        const person = session.userId && !config.person.userId ? await tx.person.update({ where: { id: config.person.id }, data: { userId: session.userId } }) : config.person;
        return { person, group: config.group };
      }

      let person;
      if (typeof personId === "string" && personId) {
        person = await tx.person.findFirst({ where: { id: personId, groupId } });
        if (!person) throw new ParticipationError("Participante não encontrado neste grupo", 404);
      } else {
        if (typeof name !== "string" || !name.trim()) {
          throw new ParticipationError("Informe seu nome para participar do sorteio", 400);
        }
        if (await tx.assignment.count({ where: { groupId } })) {
          throw new ParticipationError("O sorteio já foi realizado. Exclua os resultados antes de adicionar um novo participante.", 409);
        }
        const ownMembership = session.userId ? await tx.person.findUnique({ where: { groupId_userId: { groupId, userId: session.userId } } }) : null;
        person = ownMembership || await tx.person.create({ data: { name: name.trim(), groupId, userId: session.userId } });
      }

      if (person.userId && person.userId !== session.userId) throw new ParticipationError("Este participante pertence a outra conta", 409);
      if (session.userId && !person.userId) person = await tx.person.update({ where: { id: person.id }, data: { userId: session.userId } });
      if (person.status !== "APPROVED") {
        if (await tx.assignment.count({ where: { groupId } })) throw new ParticipationError("Exclua os resultados do sorteio antes de entrar como participante", 409);
        person = await tx.person.update({ where: { id: person.id }, data: { status: "APPROVED" } });
      }
      const linked = await tx.adminConfig.updateMany({ where: { groupId, personId: null }, data: { personId: person.id } });
      if (!linked.count) {
        throw new ParticipationError("Sua participação foi atualizada em outra sessão. Tente novamente.", 409);
      }
      return { person, group: config.group };
    }, { isolationLevel: "Serializable" });

    session.adminPersonId = result.person.id;
    session.personId = result.person.id;
    session.personName = result.person.name;
    session.groupId = result.group.id;
    session.groupName = result.group.name;
    session.loginMethod = "admin";
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ person: { id: result.person.id, name: result.person.name } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") return NextResponse.json({ error: "O grupo foi atualizado. Tente novamente." }, { status: 409 });
    if (error instanceof ParticipationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error registering administrator participation:", error);
    return NextResponse.json({ error: "Não foi possível cadastrar sua participação" }, { status: 500 });
  }
}
