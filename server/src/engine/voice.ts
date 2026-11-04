import type { ReasonCode } from "./verdict";

// Voice rules: funny, never cruel. No profanity. No unsafe advice
// (never joke someone into skipping rent, food or bills, or into borrowing).
// The voice only picks words. It never changes a verdict.

export type Money = {
  amount: number; // price, in paisa
  balance: number; // balance before buying, in paisa
  remaining: number; // balance after buying, in paisa
};

type Fmt = { amount: string; balance: string; remaining: string; shortBy: string };
type Line = (m: Fmt) => string;

export function rupees(paisa: number): string {
  return `Rs ${Math.round(paisa / 100).toLocaleString("en-US")}`;
}

const POOLS: Record<ReasonCode, Line[]> = {
  OK: [
    (m) => `Go ahead. You'd still have ${m.remaining} left. Nobody is mad at you.`,
    (m) => `Clean pass. ${m.remaining} stays in your pocket afterwards. Enjoy it without the guilt.`,
    (m) => `Yeah, you can afford this. ${m.remaining} left over, so no sad faces later.`,
    () => `Approved. Your budget has no complaints and neither do I.`,
    (m) => `You're good. ${m.remaining} still standing after this. Treat yourself, responsibly.`,
    () => `Numbers say yes. Spend it and enjoy it, you earned that.`,
  ],
  TOO_EXPENSIVE: [
    (m) => `You have ${m.balance}. That thing costs ${m.amount}. This is not a negotiation, it's arithmetic.`,
    (m) => `${m.amount} on ${m.balance}? Your wallet just left the chat.`,
    (m) => `Bro has ${m.balance} and a ${m.amount} dream. Respect the ambition, deny the purchase.`,
    () => `Your bank balance looked at that price tag and went quiet.`,
    (m) => `Not today. You'd be ${m.shortBy} short, and that's before chai.`,
    (m) => `The price is ${m.amount}. Your balance is ${m.balance}. Even the calculator feels bad for you.`,
  ],
  OVER_BUDGET: [
    () => `You can pay for it, but the budget you set said otherwise. Past you is watching.`,
    () => `The money exists. The permission doesn't. This would push the category past its limit.`,
    () => `Technically yes, budget-wise no. You made that rule, so break it on purpose or not at all.`,
    () => `Past you made a budget for exactly this moment. Past you is judging.`,
    () => `Affordable, sure. Allowed, no. Break your own rule if you want, just don't act surprised later.`,
  ],
  THIN_BUFFER: [
    (m) => `You can afford it, but you'd be left with ${m.remaining}. One random bill and it's chai-only for the week.`,
    (m) => `Survivable. You'd have ${m.remaining} left. That's not a safety net, that's a thread.`,
    (m) => `Doable, but ${m.remaining} left is cutting it close. Your future self is already sweating.`,
    (m) => `${m.remaining} left after this. One surprise expense and you're doing mental math at the counter.`,
    (m) => `You'd live, with ${m.remaining} to your name. Not comfortable, just alive.`,
  ],
};

// Used when buying would leave exactly zero.
const EMPTY_WALLET: Line[] = [
  () => `That's every last rupee. Zero left. Bold move, but no.`,
  () => `You'd hit exactly Rs 0. Not "low", not "tight". Zero.`,
  () => `Spending the final rupee? Even your pocket lint would be nervous.`,
  () => `After this you'd have nothing. Not a joke, literally nothing.`,
];

export function pickLine(reason: ReasonCode, money: Money): string {
  const fmt: Fmt = {
    amount: rupees(money.amount),
    balance: rupees(money.balance),
    remaining: rupees(money.remaining),
    shortBy: rupees(Math.max(0, money.amount - money.balance)),
  };

  const pool = reason === "THIN_BUFFER" && money.remaining === 0 ? EMPTY_WALLET : POOLS[reason];

  // Same numbers always give the same line, so tests stay stable.
  const seed = Math.abs(money.amount % 9973) * 31 + Math.abs(money.balance % 9973);
  return pool[seed % pool.length](fmt);
}