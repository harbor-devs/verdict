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

function rupees(paisa: number): string {
  return `Rs ${Math.round(paisa / 100).toLocaleString("en-US")}`;
}

export function getVerdict(input: VerdictInput): VerdictResult {
  const { amount, balance, monthIncome, categoryBudget } = input;

  assertPaisa("amount", amount);
  assertPaisa("balance", balance);
  assertPaisa("monthIncome", monthIncome);
  if (amount <= 0) throw new RangeError("amount must be more than zero");
  if (monthIncome < 0) throw new RangeError("monthIncome cannot be negative");

  const remainingBalance = balance - amount;

  if (remainingBalance < 0) {
    return {
      verdict: "NO",
      reason: "TOO_EXPENSIVE",
      remainingBalance,
      message: `Bro has ${rupees(balance)} and wants a ${rupees(amount)} thing. The math says no.`,
    };
  }

  if (categoryBudget) {
    assertPaisa("budget limit", categoryBudget.limit);
    assertPaisa("budget spent", categoryBudget.spent);
    if (categoryBudget.spent + amount > categoryBudget.limit) {
      return {
        verdict: "RISKY",
        reason: "OVER_BUDGET",
        remainingBalance,
        message: "You can pay for it, but your budget for this category is going to cry.",
      };
    }
  }

  const buffer = Math.floor((monthIncome * BUFFER_PERCENT) / 100);
  if (remainingBalance === 0 || remainingBalance < buffer) {
    return {
      verdict: "RISKY",
      reason: "THIN_BUFFER",
      remainingBalance,
      message: `You can afford it, but you'd have ${rupees(remainingBalance)} left. One surprise bill and you're panicking.`,
    };
  }

  return {
    verdict: "YES",
    reason: "OK",
    remainingBalance,
    message: `Go ahead. You'll still have ${rupees(remainingBalance)} left and your future self isn't mad.`,
  };
}