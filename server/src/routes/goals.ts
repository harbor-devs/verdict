import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { requireAuth, type AuthUser } from "../auth/session";
import { paisaToRupees, rupeesToPaisa } from "../lib/money";
import { isPositiveAmount, isRealDate } from "../lib/validation";
import { sendNotFound, sendValidationError } from "../lib/http";

export const goalsRouter = Router();

// Every route in this file needs a logged in user.
goalsRouter.use(requireAuth);

const amountField = z
  .union([z.string(), z.number()], { message: "Enter an amount" })
  .refine(isPositiveAmount, "Enter an amount above zero, with up to 2 decimals");

const createSchema = z.object({
  name: z.string().trim().min(1, "Give your goal a name").max(60, "Name is too long"),
  targetAmount: amountField,
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
    .refine(isRealDate, "That date does not exist")
    .optional(),
});

const addSchema = z.object({ amount: amountField });

const idSchema = z.object({ id: z.uuid("That is not a valid id") });

const COLUMNS = `id, name,
  target_amount::text AS target_amount,
  saved_amount::text AS saved_amount,
  to_char(target_date, 'YYYY-MM-DD') AS target_date,
  created_at`;

type Row = {
  id: string;
  name: string;
  target_amount: string;
  saved_amount: string;
  target_date: string | null;
  created_at: Date;
};

function toGoal(row: Row) {
  const target = rupeesToPaisa(row.target_amount);
  const saved = rupeesToPaisa(row.saved_amount);
  // Whole percent, capped at 100. Integer maths on paisa, so no rounding surprises.
  const percent = Math.min(100, Math.floor((saved * 100) / target));

  return {
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    savedAmount: row.saved_amount,
    remaining: paisaToRupees(Math.max(0, target - saved)),
    percent,
    reached: saved >= target,
    targetDate: row.target_date,
    createdAt: row.created_at,
  };
}

goalsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const user = res.locals.user as AuthUser;
  const { name, targetAmount, targetDate } = parsed.data;
  const targetText = paisaToRupees(rupeesToPaisa(targetAmount));

  const { rows } = await pool.query<Row>(
    `INSERT INTO savings_goals (user_id, name, target_amount, target_date)
     VALUES ($1, $2, $3, $4::date)
     RETURNING ${COLUMNS}`,
    [user.id, name, targetText, targetDate ?? null],
  );

  res.status(201).json({ goal: toGoal(rows[0]) });
});

goalsRouter.get("/", async (_req, res) => {
  const user = res.locals.user as AuthUser;

  const { rows } = await pool.query<Row>(
    `SELECT ${COLUMNS}
       FROM savings_goals
      WHERE user_id = $1
      ORDER BY created_at DESC`,
    [user.id],
  );

  res.json({ goals: rows.map(toGoal) });
});

// Adds money to a goal. This only moves the goal's own counter for now.
goalsRouter.post("/:id/add", async (req, res) => {
  const idParsed = idSchema.safeParse(req.params);
  if (!idParsed.success) {
    sendValidationError(res, idParsed.error);
    return;
  }
  const bodyParsed = addSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    sendValidationError(res, bodyParsed.error);
    return;
  }

  const user = res.locals.user as AuthUser;
  const amountText = paisaToRupees(rupeesToPaisa(bodyParsed.data.amount));

  // One UPDATE does the adding, so two quick requests cannot overwrite each other.
  const { rows } = await pool.query<Row>(
    `UPDATE savings_goals
        SET saved_amount = saved_amount + $1
      WHERE id = $2 AND user_id = $3
      RETURNING ${COLUMNS}`,
    [amountText, idParsed.data.id, user.id],
  );

  if (rows.length === 0) {
    sendNotFound(res, "Goal");
    return;
  }
  res.json({ goal: toGoal(rows[0]) });
});

goalsRouter.delete("/:id", async (req, res) => {
  const parsed = idSchema.safeParse(req.params);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const user = res.locals.user as AuthUser;
  const result = await pool.query("DELETE FROM savings_goals WHERE id = $1 AND user_id = $2", [
    parsed.data.id,
    user.id,
  ]);

  if (result.rowCount === 0) {
    sendNotFound(res, "Goal");
    return;
  }
  res.status(204).end();
});