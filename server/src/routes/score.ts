import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { requireAuth, type AuthUser } from "../auth/session";
import { getScore, MAX_POINTS } from "../engine/score";
import { rupeesToPaisa } from "../lib/money";
import { sendValidationError } from "../lib/http";

export const scoreRouter = Router();

// Every route in this file needs a logged in user.
scoreRouter.use(requireAuth);

const MONTH_START = "date_trunc('month', CURRENT_DATE)::date";
const MONTH_END = "(date_trunc('month', CURRENT_DATE) + interval '1 month')::date";

const historySchema = z.object({
  limit: z.coerce.number().int().min(1).max(365).default(30),
});

type TotalsRow = {
  total_income: string;
  total_expenses: string;
  month_income: string;
  month_expenses: string;
};

type BudgetRow = { monthly_limit: string; spent_this_month: string };
type GoalRow = { target_amount: string; saved_amount: string };
type HistoryRow = { score: number; calculated_at: Date };

// Keeps one history row per day. Checking again the same day updates that row.
async function saveToday(userId: string, score: number): Promise<void> {
  const updated = await pool.query(
    `UPDATE score_history
        SET score = $2, calculated_at = now()
      WHERE id = (
        SELECT id FROM score_history
         WHERE user_id = $1 AND calculated_at >= CURRENT_DATE
         ORDER BY calculated_at DESC
         LIMIT 1
      )`,
    [userId, score],
  );

  if (updated.rowCount === 0) {
    await pool.query("INSERT INTO score_history (user_id, score) VALUES ($1, $2)", [
      userId,
      score,
    ]);
  }
}

scoreRouter.get("/", async (_req, res) => {
  const user = res.locals.user as AuthUser;

  const [totals, budgetRows, goalRows] = await Promise.all([
    pool.query<TotalsRow>(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE kind = 'income'), 0)::numeric(14,2)::text AS total_income,
         COALESCE(SUM(amount) FILTER (WHERE kind = 'expense'), 0)::numeric(14,2)::text AS total_expenses,
         COALESCE(SUM(amount) FILTER (
           WHERE kind = 'income'
             AND occurred_on >= ${MONTH_START} AND occurred_on < ${MONTH_END}
         ), 0)::numeric(14,2)::text AS month_income,
         COALESCE(SUM(amount) FILTER (
           WHERE kind = 'expense'
             AND occurred_on >= ${MONTH_START} AND occurred_on < ${MONTH_END}
         ), 0)::numeric(14,2)::text AS month_expenses
       FROM transactions
      WHERE user_id = $1`,
      [user.id],
    ),
    pool.query<BudgetRow>(
      `SELECT b.monthly_limit::text AS monthly_limit,
              COALESCE((
                SELECT SUM(t.amount)
                  FROM transactions t
                 WHERE t.user_id = b.user_id
                   AND t.kind = 'expense'
                   AND t.category = b.category
                   AND t.occurred_on >= ${MONTH_START}
                   AND t.occurred_on < ${MONTH_END}
              ), 0)::numeric(14,2)::text AS spent_this_month
         FROM budgets b
        WHERE b.user_id = $1`,
      [user.id],
    ),
    pool.query<GoalRow>(
      `SELECT target_amount::text AS target_amount, saved_amount::text AS saved_amount
         FROM savings_goals
        WHERE user_id = $1`,
      [user.id],
    ),
  ]);

  const t = totals.rows[0];
  const result = getScore({
    monthIncome: rupeesToPaisa(t.month_income),
    monthExpenses: rupeesToPaisa(t.month_expenses),
    balance: rupeesToPaisa(t.total_income) - rupeesToPaisa(t.total_expenses),
    budgets: budgetRows.rows.map((row) => ({
      limit: rupeesToPaisa(row.monthly_limit),
      spent: rupeesToPaisa(row.spent_this_month),
    })),
    goals: goalRows.rows.map((row) => ({
      target: rupeesToPaisa(row.target_amount),
      saved: rupeesToPaisa(row.saved_amount),
    })),
  });

  if (result.status === "not_enough_data") {
    res.json({
      score: { status: result.status, message: "Log some income this month to get a score." },
    });
    return;
  }

  await saveToday(user.id, result.score);
  res.json({ score: { ...result, maxPoints: MAX_POINTS } });
});

scoreRouter.get("/history", async (req, res) => {
  const parsed = historySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const user = res.locals.user as AuthUser;
  const { rows } = await pool.query<HistoryRow>(
    `SELECT score, calculated_at
       FROM score_history
      WHERE user_id = $1
      ORDER BY calculated_at DESC
      LIMIT $2`,
    [user.id, parsed.data.limit],
  );

  res.json({
    history: rows.map((row) => ({ score: row.score, calculatedAt: row.calculated_at })),
  });
});