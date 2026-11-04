// Converts a rupee amount like "1234.5" or 1234.5 into whole paisa (123450).
// Only plain digits with at most 2 decimals are accepted, so there is no rounding guesswork.
export function rupeesToPaisa(value: string | number): number {
  const text = typeof value === "number" ? String(value) : value.trim();

  if (!/^\d{1,12}(\.\d{1,2})?$/.test(text)) {
    throw new RangeError("Enter a valid amount with at most 2 decimals");
  }

  const [whole, fraction = ""] = text.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

// Converts whole paisa (123450) into a rupee string with 2 decimals ("1234.50").
export function paisaToRupees(paisa: number): string {
  if (!Number.isSafeInteger(paisa)) {
    throw new RangeError("paisa must be a whole number");
  }

  const sign = paisa < 0 ? "-" : "";
  const abs = Math.abs(paisa);
  const whole = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}