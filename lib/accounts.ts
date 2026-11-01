import bcrypt from "bcryptjs";
import type { Prisma } from "@/app/generated/prisma";
import type { IronSession } from "iron-session";
import type { SessionData } from "@/lib/session";
import { normalizeFullName } from "@/lib/participants";
import { validatePassword } from "@/lib/password";

export class AccountError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export async function registrationData(body: { name?: unknown; email?: unknown; password?: unknown }) {
  const name = normalizeFullName(body.name);
  const email = normalizeEmail(body.email);
  if (!name) throw new AccountError("Informe seu nome completo, com nome e sobrenome");
  if (!email) throw new AccountError("Informe um e-mail válido");
  if (typeof body.password !== "string") throw new AccountError("Informe uma senha com pelo menos 4 caracteres");
  const validation = validatePassword(body.password);
  if (!validation.valid) throw new AccountError(validation.error || "Senha inválida");
  // bcrypt silently truncates long passwords; reject rather than accept a different secret.
  if (Buffer.byteLength(body.password as string, "utf8") > 72) throw new AccountError("A senha deve ocupar no máximo 72 bytes");
  return { name, email, passwordHash: await bcrypt.hash(body.password as string, 12) };
}

export function clearGroupSession(session: IronSession<SessionData>) {
  for (const key of ["personId", "personName", "groupId", "groupName", "loginMethod", "pendingPersonId", "pendingGroupId", "adminGroupId", "adminGroupName", "adminInviteCode", "adminPersonId"] as const) delete session[key];
  session.isAdmin = false;
  session.isLoggedIn = false;
}

// Only a signed session can prove ownership of a membership created before accounts existed.
export async function linkLegacySession(tx: Prisma.TransactionClient, session: SessionData, userId: string) {
  if (session.userId) return;
  const claims = [
    { id: session.pendingPersonId, groupId: session.pendingGroupId },
    { id: session.personId, groupId: session.groupId },
    { id: session.isAdmin ? session.adminPersonId : undefined, groupId: session.adminGroupId },
  ];
  for (const claim of claims) {
    if (!claim.id || !claim.groupId) continue;
    const existing = await tx.person.findUnique({ where: { groupId_userId: { groupId: claim.groupId, userId } } });
    if (!existing) await tx.person.updateMany({ where: { id: claim.id, groupId: claim.groupId, userId: null }, data: { userId } });
  }
  if (session.isAdmin && session.adminGroupId) {
    await tx.adminConfig.updateMany({ where: { groupId: session.adminGroupId, userId: null }, data: { userId } });
  }
}

export async function requestMembership(tx: Prisma.TransactionClient, user: { id: string; name: string }, inviteCode: unknown) {
  if (typeof inviteCode !== "string" || !inviteCode.trim()) throw new AccountError("Convite inválido");
  const group = await tx.group.findUnique({ where: { inviteCode: inviteCode.trim().toUpperCase() } });
  if (!group) throw new AccountError("Convite não encontrado", 404);
  const existing = await tx.person.findUnique({ where: { groupId_userId: { groupId: group.id, userId: user.id } } });
  if (existing) return existing;
  if (await tx.assignment.count({ where: { groupId: group.id } })) throw new AccountError("O sorteio deste grupo já foi realizado. Fale com o administrador.", 409);
  return tx.person.create({ data: { groupId: group.id, userId: user.id, name: user.name, status: "PENDING" } });
}

export function accountErrorResponse(error: unknown) {
  if (error instanceof AccountError) return { error: error.message, status: error.status };
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "P2002") return { error: "Este e-mail já tem uma conta. Entre com sua senha.", status: 409 };
  if (code === "P2034") return { error: "Os dados foram atualizados. Tente novamente.", status: 409 };
  return { error: "Não foi possível concluir. Tente novamente.", status: 500 };
}
