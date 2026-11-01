import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const groupId = request.nextUrl.searchParams.get("groupId");
    if (!session.isAdmin || !groupId || session.adminGroupId !== groupId) {
      return NextResponse.json({ error: "É necessário administrar este grupo" }, { status: 403 });
    }
    const people = await prisma.person.findMany({ where: { groupId }, include: { _count: { select: { wishlistItems: true } } }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ people });
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json({ error: "Não foi possível carregar os participantes" }, { status: 500 });
  }
}
