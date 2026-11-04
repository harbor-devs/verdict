import { pickLine } from "./voice";

export type Verdict = "YES" | "RISKY" | "NO";
export type ReasonCode = "OK" | "TOO_EXPENSIVE" | "OVER_BUDGET" | "THIN_BUFFER";

// All money values are whole paisa (Rs 1 = 100 paisa).
export type VerdictInput = {
  amount: number; // price of the thing
  balance: number; // all income minus all expenses so far
  monthIncome: number; // income this month
  categoryBudget?: { limit: number; spent: number }; // this month, for the item's category
};

export type VerdictResult = {
  verdict: Verdict;
  reason: ReasonCode;
  remainingBalance: number;
  message: string;
};

// Keep at least this share of the month's income after buying.
export const BUFFER_PERCENT = 20;

function assertPaisa(name: string, value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a whole number of paisa`);
  }
}

export function getVerdict(input: VerdictInput): VerdictResult {
  const { amount, balance, monthIncome, categoryBudget } = input;

  assertPaisa("amount", amount);
  assertPaisa("balance", balance);
  assertPaisa("monthIncome", monthIncome);
  if (amount <= 0) throw new RangeError("amount must be more than zero");
  if (monthIncome < 0) throw new RangeError("monthIncome cannot be negative");

  const remainingBalance = balance - amount;

  function result(verdict: Verdict, reason: ReasonCode): VerdictResult {
    return {
      verdict,
      reason,
      remainingBalance,
      message: pickLine(reason, { amount, balance, remaining: remainingBalance }),
    };
  }

  if (remainingBalance < 0) {
    return result("NO", "TOO_EXPENSIVE");
  }

  if (categoryBudget) {
    assertPaisa("budget limit", categoryBudget.limit);
    assertPaisa("budget spent", categoryBudget.spent);
    if (categoryBudget.spent + amount > categoryBudget.limit) {
      return result("RISKY", "OVER_BUDGET");
    }
  }

  const buffer = Math.floor((monthIncome * BUFFER_PERCENT) / 100);
  if (remainingBalance === 0 || remainingBalance < buffer) {
    return result("RISKY", "THIN_BUFFER");
  }

  return result("YES", "OK");
}