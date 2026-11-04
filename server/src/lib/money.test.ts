import { describe, expect, it } from "vitest";
import { paisaToRupees, rupeesToPaisa } from "./money";

describe("rupeesToPaisa", () => {
  it("converts strings and numbers exactly", () => {
    expect(rupeesToPaisa("1234.5")).toBe(123450);
    expect(rupeesToPaisa("0.07")).toBe(7);
    expect(rupeesToPaisa("10")).toBe(1000);
    expect(rupeesToPaisa(3200)).toBe(320000);
    expect(rupeesToPaisa(19.99)).toBe(1999);
  });

  it("rejects bad input", () => {
    for (const bad of ["", " ", "abc", "-5", "1.234", "1,000", "1e5"]) {
      expect(() => rupeesToPaisa(bad)).toThrow(RangeError);
    }
    expect(() => rupeesToPaisa(0.1 + 0.2)).toThrow(RangeError);
    expect(() => rupeesToPaisa(1e-7)).toThrow(RangeError);
  });
});

describe("paisaToRupees", () => {
  it("formats paisa as rupees with 2 decimals", () => {
    expect(paisaToRupees(123450)).toBe("1234.50");
    expect(paisaToRupees(7)).toBe("0.07");
    expect(paisaToRupees(0)).toBe("0.00");
    expect(paisaToRupees(-250)).toBe("-2.50");
  });

  it("round trips without losing a paisa", () => {
    for (const amount of ["0.01", "19.99", "1234.50", "999999999999.99"]) {
      expect(paisaToRupees(rupeesToPaisa(amount))).toBe(amount);
    }
  });
});