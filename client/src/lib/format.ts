// Display helpers. They only change how numbers look. They never do money math.

// The server sends money as text like "1234.50". Number() is fine here because
// we only show the value, we never add or compare it.
export function formatMoney(amount: string, currency: string): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

// Turns "2026-11" into "November 2026".
export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('en', {
    month: 'long',
    year: 'numeric',
  })
}