import { describe, expect, it } from "vitest";
import { pickLine } from "./voice";
import type { ReasonCode } from "./verdict";

const reasons: ReasonCode[] = ["OK", "TOO_EXPENSIVE", "OVER_BUDGET", "THIN_BUFFER"];

function sample(reason: ReasonCode): Set<string> {
  const lines = new Set<string>();
  for (let i = 1; i <= 300; i++) {
    lines.add(pickLine(reason, { amount: i * 137, balance: i * 911 + 5000, remaining: i * 53 + 1 }));
  }
  return lines;
}

describe("pickLine", () => {
  it("gives clean text with no dashes or broken values", () => {
    for (const reason of reasons) {
      for (const line of sample(reason)) {
        expect(line.length).toBeGreaterThan(10);
        expect(line).not.toMatch(/[\u2013\u2014]/);
        expect(line).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it("has variety for every reason", () => {
    for (const reason of reasons) {
      expect(sample(reason).size).toBeGreaterThanOrEqual(4);
    }
  });

  it("gives the same line for the same numbers", () => {
    const money = { amount: 250000, balance: 900000, remaining: 650000 };
    expect(pickLine("OK", money)).toBe(pickLine("OK", money));
  });

  it("uses a special line when exactly zero is left", () => {
    const zero = pickLine("THIN_BUFFER", { amount: 500000, balance: 500000, remaining: 0 });
    expect(sample("THIN_BUFFER").has(zero)).toBe(false);
  });
});