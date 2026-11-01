export type ParticipantStatus = "PENDING" | "APPROVED" | "REJECTED";

export function normalizeFullName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  const parts = name.split(" ");
  return name.length <= 120 && parts.length >= 2 && parts.every((part) => /\p{L}/u.test(part)) ? name : null;
}
