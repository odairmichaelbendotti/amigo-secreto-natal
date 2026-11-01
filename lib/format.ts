export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(amount);
}
