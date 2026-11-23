import { randomBytes } from "crypto";

// Generate a unique group invite code (6 characters, alphanumeric)
export function generateGroupInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude similar looking chars
  let code = "";
  const bytes = randomBytes(6);

  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }

  return code;
}

// An empty list clears the wishes; only the title is required for each item.
export function validateWishlistItems(items: Array<{ title: string; link?: string }>): { valid: boolean; error?: string } {
  if (items.length > 5) {
    return { valid: false, error: "Sua lista de desejos pode ter no máximo 5 itens" };
  }

  for (const item of items) {
    if (!item || typeof item.title !== "string" || item.title.trim().length === 0) {
      return { valid: false, error: "Todos os itens devem ter um título" };
    }
    if (item.title.trim().length > 200) {
      return { valid: false, error: "Cada desejo pode ter até 200 caracteres" };
    }
    // Keep existing product links optional and safe to open.
    if (item.link !== undefined) {
      if (typeof item.link !== "string") return { valid: false, error: "Link inválido" };
      if (item.link.trim()) {
        try {
          const url = new URL(item.link);
          if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("protocol");
        } catch {
          return { valid: false, error: `URL inválida: ${item.link}` };
        }
      }
    }
  }

  return { valid: true };
}
