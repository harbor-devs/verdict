import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { requireAuth, type AuthUser } from "../auth/session";
import { getVerdict } from "../engine/verdict";
import { paisaToRupees, rupeesToPaisa } from "../lib/money";
import { sendValidationError } from "../lib/http";

export const verdictRouter = Router();

verdictRouter.use(requireAuth);

function isPositiveAmount(value: string | number): boolean {
  try {
    return rupeesToPaisa(value) > 0;
  } catch {
    return false;
  }
}

const askSchema = z.object({
  amount: z
    .union([z.string(), z.number()], { message: "Enter the price" })
    .refine(isPositiveAmount, "Enter a price above zero, with up to 2 decimals"),
  category: z.string().trim().max(40, "Category is too long").toLowerCase().optional(),
});

// The database adds everything up in exact numbers, then we convert to whole paisa.
const MONTH_START = "date_trunc('month', CURRENT_DATE)::date";
const MONTH_END = "(date_trunc('month', CURRENT_DATE) + interval '1 month')::date";

const SUMMARY_SQL = `
  SELECT
    ROUND(COALESCE(SUM(CASE WHEN kind = 'income' THEN amount ELSE -amount END), 0) * 100)::bigint AS balance_paisa,
    ROUND(COALESCE(SUM(amount) FILTER (
      WHERE kind = 'income' AND occurred_on >= ${MONTH_START} AND occurred_on < ${MONTH_END}
    ), 0) * 100)::bigint AS month_income_paisa,
    ROUND(COALESCE(SUM(amount) FILTER (
      WHERE kind = 'expense' AND category = $2 AND occurred_on >= ${MONTH_START} AND occurred_on < ${MONTH_END}
    ), 0) * 100)::bigint AS category_spent_paisa,
    (SELECT ROUND(monthly_limit * 100)::bigint FROM budgets WHERE user_id = $1 AND category = $2) AS budget_limit_paisa
  FROM transactions
  WHERE user_id = $1
`;

verdictRouter.post("/", async (req, res) => {
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const user = res.locals.user as AuthUser;
  const amount = rupeesToPaisa(parsed.data.amount);
  const category = parsed.data.category ?? "";

  const { rows } = await pool.query(SUMMARY_SQL, [user.id, category]);
  const row = rows[0];

  const balance = Number(row.balance_paisa);
  const monthIncome = Number(row.month_income_paisa);
  const spent = Number(row.category_spent_paisa);
  const limit = row.budget_limit_paisa === null ? null : Number(row.budget_limit_paisa);

  const result = getVerdict({
    amount,
    balance,
    monthIncome,
    categoryBudget: limit === null ? undefined : { limit, spent },
  });

  res.json({
    verdict: result.verdict,
    reason: result.reason,
    message: result.message,
    amount: paisaToRupees(amount),
    balance: paisaToRupees(balance),
    remainingBalance: paisaToRupees(result.remainingBalance),
    budget: limit === null ? null : { limit: paisaToRupees(limit), spentThisMonth: paisaToRupees(spent) },
  });
});