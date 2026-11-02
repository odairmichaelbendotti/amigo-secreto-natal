import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { resolveGroupTheme } from "@/lib/group-theme";
export const dynamic = "force-dynamic";
export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Entre na sua conta" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, name: true, email: true } });
  if (!user) return NextResponse.json({ error: "Entre na sua conta" }, { status: 401 });
  const groups = await prisma.group.findMany({
    where: { OR: [{ people: { some: { userId: user.id } } }, { adminConfig: { userId: user.id } }] },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, year: true, wishlistsEnabled: true, theme: true, people: { where: { userId: user.id }, select: { status: true } }, adminConfig: { select: { userId: true } } },
  });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email }, groups: groups.map(g => ({ id: g.id, name: g.name, year: g.year, wishlistsEnabled: g.wishlistsEnabled, theme: resolveGroupTheme(g.theme), status: g.people[0]?.status ?? null, isAdmin: g.adminConfig?.userId === user.id })) }, { headers: { "Cache-Control": "no-store" } });
}
