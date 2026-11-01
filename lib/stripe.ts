import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: "Grátis",
    maxGroups: Infinity,
    maxParticipants: 10,
    maxWishlistItems: 5,
    features: [
      "Grupos ilimitados",
      "Até 10 participantes por grupo",
      "Lista de desejos com até 5 itens",
      "Sorteio automático e aleatório",
      "Convites por link com aprovação",
      "Valor do presente em várias moedas",
      "Interface adaptada para celular",
    ],
  },
  unlimited: {
    name: "Ilimitado",
    priceId: 'price_1TDAokBiNvYQF2cP1HlmIisk',
    price: "US$ 10",
    priceUsd: "US$ 10",
    maxGroups: Infinity,
    maxParticipants: Infinity,
    maxWishlistItems: 5,
    features: [
      "Tudo do plano grátis",
      "Participantes ilimitados por grupo",
      "Pagamento único",
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;

export function getPlanLimits(plan: PlanType) {
  return PLANS[plan];
}

export function canAddParticipant(plan: PlanType, currentCount: number): boolean {
  return currentCount < PLANS[plan].maxParticipants;
}

export function getMaxWishlistItems(plan: PlanType): number {
  return PLANS[plan].maxWishlistItems;
}
