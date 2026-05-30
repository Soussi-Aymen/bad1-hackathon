// Compact EUR formatting for round sizes / allocations (e.g. 2400000 -> "€2.4M").
export function eur(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000
    return `€${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `€${Math.round(amount / 1000)}k`
  }
  return `€${amount}`
}
