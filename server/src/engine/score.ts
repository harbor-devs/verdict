import { BUFFER_PERCENT } from "./verdict";

export type ScoreBand = "solid" | "okay" | "shaky" | "rough";

// All money values are whole paisa (Rs 1 = 100 paisa).
export type ScoreInput = {
  monthIncome: number; // income this month
  monthExpenses: number; // expenses this month
  balance: number; // all income minus all expenses so far
  budgets: { limit: number; spent: number }[]; // this month, one per category
  goals: { target: number; saved: number }[];
};

export type ScoreParts = {
  savings: number; // out of 40
  budgets: number; // out of 30
  goals: number; // out of 15
  cushion: number; // out of 15
};

export type ScoreResult =
  | { status: "not_enough_data" }
  | {
      status: "ok";
      score: number;
      band: ScoreBand;
      parts: ScoreParts;
      hasBudgets: boolean;
      hasGoals: boolean;
    };

export const MAX_POINTS = { savings: 40, budgets: 30, goals: 15, cushion: 15 } as const;

// Half points when the user has not set any budgets or goals yet.
export const NO_BUDGETS_POINTS = 15;
export const NO_GOALS_POINTS = 7;

// The balance should cover this many months of this month's spending.
export const CUSHION_MONTHS = 3;

function assertPaisa(name: string, value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a whole number of paisa`);
  }
}

function assertNotNegative(name: string, value: number): void {
  assertPaisa(name, value);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

// Full marks when you keep BUFFER_PERCENT of income. Less than that scales down.
function savingsPoints(income: number, expenses: number): number {
  const saved = income - expenses;
  if (saved <= 0) return 0;

  const goal = Math.floor((income * BUFFER_PERCENT) / 100);
  if (goal === 0 || saved >= goal) return MAX_POINTS.savings;

  return Math.floor((saved * MAX_POINTS.savings) / goal);
}

// Each budget is either within its limit or over it.
function budgetPoints(budgets: ScoreInput["budgets"]): number {
  if (budgets.length === 0) return NO_BUDGETS_POINTS;

  let withinLimit = 0;
  for (const budget of budgets) {
    assertNotNegative("budget limit", budget.limit);
    assertNotNegative("budget spent", budget.spent);
    if (budget.spent <= budget.limit) withinLimit += 1;
  }
  return Math.floor((MAX_POINTS.budgets * withinLimit) / budgets.length);
}

// Average progress across goals. Progress is capped at 100 percent per goal.
function goalPoints(goals: ScoreInput["goals"]): number {
  if (goals.length === 0) return NO_GOALS_POINTS;

  let totalPercent = 0;
  for (const goal of goals) {
    assertNotNegative("goal saved", goal.saved);
    assertPaisa("goal target", goal.target);
    if (goal.target <= 0) throw new RangeError("goal target must be more than zero");
    totalPercent += Math.floor((Math.min(goal.saved, goal.target) * 100) / goal.target);
  }
  return Math.floor((MAX_POINTS.goals * totalPercent) / (goals.length * 100));
}

// Full marks when the balance covers CUSHION_MONTHS of this month's spending.
function cushionPoints(balance: number, expenses: number): number {
  if (balance <= 0) return 0;
  if (expenses === 0) return MAX_POINTS.cushion;

  const wanted = expenses * CUSHION_MONTHS;
  return Math.floor((Math.min(balance, wanted) * MAX_POINTS.cushion) / wanted);
}

function bandFor(score: number): ScoreBand {
  if (score >= 80) return "solid";
  if (score >= 60) return "okay";
  if (score >= 40) return "shaky";
  return "rough";
}

export function getScore(input: ScoreInput): ScoreResult {
  const { monthIncome, monthExpenses, balance, budgets, goals } = input;

  assertNotNegative("monthIncome", monthIncome);
  assertNotNegative("monthExpenses", monthExpenses);
  assertPaisa("balance", balance);

  // No income logged this month means we do not invent a score.
  if (monthIncome === 0) return { status: "not_enough_data" };

  const parts: ScoreParts = {
    savings: savingsPoints(monthIncome, monthExpenses),
    budgets: budgetPoints(budgets),
    goals: goalPoints(goals),
    cushion: cushionPoints(balance, monthExpenses),
  };
  const score = parts.savings + parts.budgets + parts.goals + parts.cushion;

  return {
    status: "ok",
    score,
    band: bandFor(score),
    parts,
    hasBudgets: budgets.length > 0,
    hasGoals: goals.length > 0,
  };
}