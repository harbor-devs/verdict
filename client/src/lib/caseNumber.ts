// This month as "2026-11". Used as the case number on every page. Decoration only.
export function currentCase(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}