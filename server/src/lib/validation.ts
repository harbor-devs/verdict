import { rupeesToPaisa } from "./money";

// True when the value is a valid rupee amount above zero (up to 2 decimals).
export function isPositiveAmount(value: string | number): boolean {
  try {
    return rupeesToPaisa(value) > 0;
  } catch {
    return false;
  }
}

// True when the text is a real calendar date in the form YYYY-MM-DD.
export function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}