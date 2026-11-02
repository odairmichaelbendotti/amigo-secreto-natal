import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isGroupTheme } from "@/lib/group-theme";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const groupId = params.id;

    // Verify user has access to this group
    const userGroupId = session.isAdmin ? session.adminGroupId : session.groupId;
    if (userGroupId !== groupId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (!session.isAdmin) {
      const participant = session.isLoggedIn && session.personId ? await prisma.person.findFirst({ where: { id: session.personId, groupId, status: "APPROVED" }, select: { id: true } }) : null;
      if (!participant) return NextResponse.json({ error: "Sua participação precisa ser aprovada" }, { status: 403 });
    }
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            people: true,
            assignments: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const groupId = params.id;

    // Only admins can modify groups
    if (!session.isAdmin || session.adminGroupId !== groupId) {
      return NextResponse.json({ error: "É necessário entrar como administrador" }, { status: 403 });
    }

    const { budgetAmount, budgetCurrency, wishlistsEnabled, theme } = await request.json();

    if (theme !== undefined && !isGroupTheme(theme)) return NextResponse.json({ error: "Escolha um tema válido para o grupo" }, { status: 400 });

    if (wishlistsEnabled !== undefined && typeof wishlistsEnabled !== "boolean") {
      return NextResponse.json({ error: "Informe se as listas de desejos devem ser exibidas" }, { status: 400 });
    }

    // Validate currency if provided
    const validCurrencies = [
      'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'ZAR', 'JPY', 'CHF',
      'SEK', 'NOK', 'DKK', 'NZD', 'MXN', 'BRL', 'INR', 'CNY',
      'KRW', 'SGD'
    ];

    if (budgetCurrency !== undefined && !validCurrencies.includes(budgetCurrency)) {
      return NextResponse.json(
        { error: "Código de moeda inválido" },
        { status: 400 }
      );
    }

    if (budgetAmount !== undefined && budgetAmount !== null && (typeof budgetAmount !== "number" || !Number.isFinite(budgetAmount) || budgetAmount < 0)) {
      return NextResponse.json(
        { error: "O valor do presente deve ser um número positivo" },
        { status: 400 }
      );
    }

    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        ...(budgetAmount !== undefined ? { budgetAmount } : {}),
        ...(budgetCurrency !== undefined ? { budgetCurrency } : {}),
        ...(wishlistsEnabled !== undefined ? { wishlistsEnabled } : {}),
        ...(theme !== undefined ? { theme } : {}),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
