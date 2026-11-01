export const MIN_DRAW_PARTICIPANTS = 2;

export function getDrawBlockReason(approvedCount: number): string | null {
  if (approvedCount === 0) {
    return "Ainda não há participantes aprovados. Aprove pelo menos 2 pessoas para sortear sem que alguém tire a si mesmo.";
  }
  if (approvedCount < MIN_DRAW_PARTICIPANTS) {
    return "Falta aprovar mais 1 participante. Uma pessoa sozinha não pode tirar a si mesma.";
  }
  return null;
}
