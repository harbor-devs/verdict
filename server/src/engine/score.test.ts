import { describe, expect, it } from "vitest";
import { getScore } from "./score";

// Rs 100,000 income in paisa
const INCOME = 10_000_000;

function okResult(input: Parameters<typeof getScore>[0]) {
  const result = getScore(input);
  if (result.status !== "ok") throw new Error("expected a score");
  return result;
}

describe("getScore", () => {
  it("gives no score when there is no income this month", () => {
    const result = getScore({
      monthIncome: 0,
      monthExpenses: 500_000,
      balance: 1_000_000,
      budgets: [],
      goals: [],
    });
    expect(result).toEqual({ status: "not_enough_data" });
  });

  it("gives 100 for a perfect month", () => {
    const result = okResult({
      monthIncome: INCOME,
      monthExpenses: 5_000_000,
      balance: 20_000_000,
      budgets: [{ limit: 6_000_000, spent: 5_000_000 }],
      goals: [{ target: 100, saved: 100 }],
    });
    expect(result.parts).toEqual({ savings: 40, budgets: 30, goals: 15, cushion: 15 });
    expect(result.score).toBe(100);
    expect(result.band).toBe("solid");
  });

  it("gives zero savings points when spending is more than income", () => {
    const result = okResult({
      monthIncome: INCOME,
      monthExpenses: 12_000_000,
      balance: 3_000_000,
      budgets: [],
      goals: [],
    });
    expect(result.parts.savings).toBe(0);
  });

  it("gives half savings points when you keep half of the 20 percent target", () => {
    const result = okResult({
      monthIncome: INCOME,
      monthExpenses: 9_000_000,
      balance: 0,
      budgets: [],
      goals: [],
    });
    expect(result.parts.savings).toBe(20);
  });

  it("gives half points for budgets and goals when none are set", () => {
    const result = okResult({
      monthIncome: INCOME,
      monthExpenses: 5_000_000,
      balance: 20_000_000,
      budgets: [],
      goals: [],
    });
    expect(result.parts.budgets).toBe(15);
    expect(result.parts.goals).toBe(7);
    expect(result.hasBudgets).toBe(false);
    expect(result.hasGoals).toBe(false);
  });

  it("loses budget points for each budget that is over its limit", () => {
    const result = okResult({
      monthIncome: INCOME,
      monthExpenses: 5_000_000,
      balance: 20_000_000,
      budgets: [
        { limit: 1_000_000, spent: 900_000 },
        { limit: 1_000_000, spent: 1_000_100 },
      ],
      goals: [],
    });
    expect(result.parts.budgets).toBe(15);
  });

  it("averages goal progress and caps each goal at 100 percent", () => {
    const result = okResult({
      monthIncome: INCOME,
      monthExpenses: 5_000_000,
      balance: 20_000_000,
      budgets: [],
      goals: [
        { target: 10_000, saved: 5_000 },
        { target: 10_000, saved: 50_000 },
      ],
    });
    expect(result.parts.goals).toBe(11);
  });

  it("scales the cushion by how many months of spending the balance covers", () => {
    const result = okResult({
      monthIncome: INCOME,
      monthExpenses: 5_000_000,
      balance: 7_500_000,
      budgets: [],
      goals: [],
    });
    expect(result.parts.cushion).toBe(7);
  });

  it("gives full cushion points when nothing was spent and the balance is positive", () => {
    const result = okResult({
      monthIncome: INCOME,
      monthExpenses: 0,
      balance: 100,
      budgets: [],
      goals: [],
    });
    expect(result.parts.cushion).toBe(15);
  });

  it("adds the parts up for a mixed month", () => {
    const result = okResult({
      monthIncome: INCOME,
      monthExpenses: 9_000_000,
      balance: 7_500_000,
      budgets: [
        { limit: 1_000_000, spent: 900_000 },
        { limit: 1_000_000, spent: 1_000_100 },
      ],
      goals: [
        { target: 10_000, saved: 5_000 },
        { target: 10_000, saved: 10_000 },
      ],
    });
    expect(result.parts).toEqual({ savings: 20, budgets: 15, goals: 11, cushion: 4 });
    expect(result.score).toBe(50);
    expect(result.band).toBe("shaky");
  });

  it("refuses money values that are not whole paisa", () => {
    expect(() =>
      getScore({
        monthIncome: 100.5,
        monthExpenses: 0,
        balance: 0,
        budgets: [],
        goals: [],
      }),
    ).toThrow(RangeError);
  });
});