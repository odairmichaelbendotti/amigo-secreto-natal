import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json({ error: "O código de convite é obrigatório" }, { status: 400 });
    }

    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      select: {
        id: true,
        name: true,
        inviteCode: true,
        year: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Código de convite inválido" }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Error verifying group:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
