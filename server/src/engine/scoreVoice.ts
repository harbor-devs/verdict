import type { ScoreBand } from "./score";

// Voice rules: funny, never cruel. No profanity. No unsafe advice
// (never joke someone into skipping rent, food or bills, or into borrowing).
// The voice only picks words. It never changes a score.

type Line = (score: number) => string;

const POOLS: Record<ScoreBand, Line[]> = {
  solid: [
    (s) => `Score ${s}. Your money is behaving. Frame this month.`,
    (s) => `${s} out of 100. Future you just sent a thank you note.`,
    (s) => `${s}. Solid month. Quietly flexing is allowed.`,
    (s) => `Strong month at ${s}. Boring finances, exciting results.`,
  ],
  okay: [
    (s) => `${s}. Not bad at all. A little polish and you're in the green.`,
    (s) => `A decent ${s}. Your money did the homework, just not the extra credit.`,
    (s) => `${s} out of 100. Respectable. Nobody's panicking, nobody's celebrating.`,
    (s) => `Okay month at ${s}. Room to grow, and no drama.`,
  ],
  shaky: [
    (s) => `${s}. Wobbly, not broken. A few tweaks go a long way.`,
    (s) => `${s} out of 100. Your budget is holding on, but it's gripping the edge.`,
    (s) => `Shaky at ${s}. One surprise bill would notice.`,
    (s) => `${s}. The month could go either way. Pick the good way.`,
  ],
  rough: [
    (s) => `${s}. Rough month, but one number doesn't define you. Next month is a clean page.`,
    (s) => `${s} out of 100. Tough one. Start small: pick one thing to fix this week.`,
    (s) => `A ${s} this month. Ouch, but fixable. Look at your biggest category first.`,
    (s) => `${s}. Not great, not the end. Let's find where the money went.`,
  ],
};

export function pickScoreLine(band: ScoreBand, score: number): string {
  const pool = POOLS[band];
  return pool[score % pool.length](score);
}

// Plain nudges for the parts that are sitting on half points.
export function getScoreTips(hasBudgets: boolean, hasGoals: boolean): string[] {
  const tips: string[] = [];
  if (!hasBudgets) tips.push("Set a budget for a category to earn more budget points.");
  if (!hasGoals) tips.push("Add a savings goal to earn more goal points.");
  return tips;
}