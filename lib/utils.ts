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

// Validate wishlist items (1-5 items with valid URLs)
export function validateWishlistItems(items: Array<{ title: string; link: string }>): { valid: boolean; error?: string } {
  if (items.length < 1) {
    return { valid: false, error: "Sua lista de desejos deve ter pelo menos 1 item" };
  }

  if (items.length > 5) {
    return { valid: false, error: "Sua lista de desejos pode ter no máximo 5 itens" };
  }

  for (const item of items) {
    if (!item.title || item.title.trim().length === 0) {
      return { valid: false, error: "Todos os itens devem ter um título" };
    }

    if (!item.link || item.link.trim().length === 0) {
      return { valid: false, error: "Todos os itens devem ter um link" };
    }

    // Basic URL validation
    try {
      new URL(item.link);
    } catch {
      return { valid: false, error: `URL inválida: ${item.link}` };
    }
  }

  return { valid: true };
}
