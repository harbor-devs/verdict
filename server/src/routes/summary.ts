import { Router } from "express";
import { pool } from "../db";
import { requireAuth, type AuthUser } from "../auth/session";
import { paisaToRupees, rupeesToPaisa } from "../lib/money";

export const summaryRouter = Router();

// Every route in this file needs a logged in user.
summaryRouter.use(requireAuth);

const MONTH_START = "date_trunc('month', CURRENT_DATE)::date";
const MONTH_END = "(date_trunc('month', CURRENT_DATE) + interval '1 month')::date";

type SummaryRow = {
  total_income: string;
  total_expenses: string;
  month_income: string;
  month_expenses: string;
  month: string;
};

// Small numbers for the Home screen: balance plus this month's income and spending.
// The balance is all time income minus all time spending. Savings goals do not change it.
summaryRouter.get("/", async (_req, res) => {
  const user = res.locals.user as AuthUser;

  const { rows } = await pool.query<SummaryRow>(
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
       ), 0)::numeric(14,2)::text AS month_expenses,
       to_char(CURRENT_DATE, 'YYYY-MM') AS month
     FROM transactions
    WHERE user_id = $1`,
    [user.id],
  );

  // A query with SUM and no GROUP BY always returns exactly one row.
  const r = rows[0];
  const balance = rupeesToPaisa(r.total_income) - rupeesToPaisa(r.total_expenses);

  res.json({
    summary: {
      month: r.month,
      balance: paisaToRupees(balance),
      monthIncome: paisaToRupees(rupeesToPaisa(r.month_income)),
      monthExpenses: paisaToRupees(rupeesToPaisa(r.month_expenses)),
    },
  });
});