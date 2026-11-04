import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { requireAuth, type AuthUser } from "../auth/session";
import { rupeesToPaisa, paisaToRupees } from "../lib/money";
import { sendNotFound, sendValidationError } from "../lib/http";

export const budgetsRouter = Router();

budgetsRouter.use(requireAuth);

function isPositiveAmount(value: string | number): boolean {
  try {
    return rupeesToPaisa(value) > 0;
  } catch {
    return false;
  }
}

const saveSchema = z.object({
  category: z.string().trim().min(1, "Pick a category").max(40, "Category is too long").toLowerCase(),
  monthlyLimit: z
    .union([z.string(), z.number()], { message: "Enter a monthly limit" })
    .refine(isPositiveAmount, "Enter a limit above zero, with up to 2 decimals"),
});

const idSchema = z.object({ id: z.uuid("That is not a valid id") });

const MONTH_START = "date_trunc('month', CURRENT_DATE)::date";
const MONTH_END = "(date_trunc('month', CURRENT_DATE) + interval '1 month')::date";

type BudgetRow = {
  id: string;
  category: string;
  monthly_limit: string;
  spent_this_month?: string;
};

budgetsRouter.get("/", async (_req, res) => {
  const user = res.locals.user as AuthUser;

  const { rows } = await pool.query<BudgetRow>(
    `SELECT b.id, b.category, b.monthly_limit::text AS monthly_limit,
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
      WHERE b.user_id = $1
      ORDER BY b.category`,
    [user.id],
  );

  res.json({
    budgets: rows.map((row) => ({
      id: row.id,
      category: row.category,
      monthlyLimit: row.monthly_limit,
      spentThisMonth: row.spent_this_month,
    })),
  });
});

// Creates the budget for a category, or updates its limit if it already exists.
budgetsRouter.put("/", async (req, res) => {
  const parsed = saveSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const user = res.locals.user as AuthUser;
  const { category, monthlyLimit } = parsed.data;
  const limitText = paisaToRupees(rupeesToPaisa(monthlyLimit));

  const { rows } = await pool.query<BudgetRow>(
    `INSERT INTO budgets (user_id, category, monthly_limit)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, category)
     DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit
     RETURNING id, category, monthly_limit::text AS monthly_limit`,
    [user.id, category, limitText],
  );

  res.json({
    budget: { id: rows[0].id, category: rows[0].category, monthlyLimit: rows[0].monthly_limit },
  });
});

budgetsRouter.delete("/:id", async (req, res) => {
  const parsed = idSchema.safeParse(req.params);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const user = res.locals.user as AuthUser;
  const result = await pool.query("DELETE FROM budgets WHERE id = $1 AND user_id = $2", [
    parsed.data.id,
    user.id,
  ]);

  if (result.rowCount === 0) {
    sendNotFound(res, "Budget");
    return;
  }
  res.status(204).end();
});