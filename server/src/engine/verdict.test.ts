import { describe, expect, it } from "vitest";
import { getVerdict } from "./verdict";

// Rs 1 = 100 paisa, so Rs 5,000 = 500000
describe("getVerdict", () => {
  it("says NO when the price is more than the balance", () => {
    const result = getVerdict({ amount: 500000, balance: 300000, monthIncome: 1000000 });
    expect(result.verdict).toBe("NO");
    expect(result.reason).toBe("TOO_EXPENSIVE");
  });

  it("says YES when there is plenty left", () => {
    const result = getVerdict({ amount: 100000, balance: 5000000, monthIncome: 1000000 });
    expect(result.verdict).toBe("YES");
    expect(result.reason).toBe("OK");
    expect(result.remainingBalance).toBe(4900000);
  });

  it("says RISKY when it goes over the category budget", () => {
    const result = getVerdict({
      amount: 20000,
      balance: 5000000,
      monthIncome: 1000000,
      categoryBudget: { limit: 100000, spent: 90000 },
    });
    expect(result.verdict).toBe("RISKY");
    expect(result.reason).toBe("OVER_BUDGET");
  });

  it("allows spending exactly up to the budget limit", () => {
    const result = getVerdict({
      amount: 10000,
      balance: 5000000,
      monthIncome: 1000000,
      categoryBudget: { limit: 100000, spent: 90000 },
    });
    expect(result.verdict).toBe("YES");
  });

  it("says RISKY when less than 20% of monthly income would be left", () => {
    const result = getVerdict({ amount: 400000, balance: 500000, monthIncome: 1000000 });
    expect(result.verdict).toBe("RISKY");
    expect(result.reason).toBe("THIN_BUFFER");
  });

  it("says RISKY when it would spend the very last rupee", () => {
    const result = getVerdict({ amount: 500000, balance: 500000, monthIncome: 0 });
    expect(result.verdict).toBe("RISKY");
    expect(result.reason).toBe("THIN_BUFFER");
  });

  it("rejects bad amounts", () => {
    expect(() => getVerdict({ amount: 0, balance: 1000, monthIncome: 0 })).toThrow();
    expect(() => getVerdict({ amount: 12.5, balance: 1000, monthIncome: 0 })).toThrow();
  });
});