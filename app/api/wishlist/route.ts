import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateWishlistItems } from "@/lib/utils";
import { getSession } from "@/lib/session";

// POST/PUT update wishlist items for a person
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.personId) {
      return NextResponse.json({ error: "É necessário entrar para continuar" }, { status: 401 });
    }

    const { personId, items } = await request.json();

    // Verify the session user matches the personId being modified
    if (personId !== session.personId) {
      return NextResponse.json({ error: "Acesso negado: você só pode alterar sua própria lista de desejos" }, { status: 403 });
    }

    if (!personId) {
      return NextResponse.json({ error: "O identificador do participante é obrigatório" }, { status: 400 });
    }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Os itens devem ser enviados em uma lista" }, { status: 400 });
    }

    // Validate wishlist items
    const validation = validateWishlistItems(items);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Verify person exists and belongs to the session's group
    const person = await prisma.person.findUnique({ where: { id: personId }, include: { group: { select: { wishlistsEnabled: true } } } });
    if (!person) {
      return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
    }
    if (person.groupId !== session.groupId || person.status !== "APPROVED") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (!person.group.wishlistsEnabled) {
      return NextResponse.json({ error: "As listas de desejos estão ocultas neste grupo. A escolha do presente é livre." }, { status: 403 });
    }

    // Delete existing wishlist items
    await prisma.wishlistItem.deleteMany({
      where: { personId },
    });

    // Create new wishlist items
    const wishlistItems = await Promise.all(
      items.map((item: { title: string; link: string }, index: number) =>
        prisma.wishlistItem.create({
          data: {
            personId,
            title: item.title.trim(),
            link: item.link.trim(),
            order: index,
          },
        })
      )
    );

    return NextResponse.json({ wishlistItems });
  } catch (error) {
    console.error("Error updating wishlist:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
