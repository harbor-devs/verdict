import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { requireAuth, type AuthUser } from "../auth/session";
import { paisaToRupees, rupeesToPaisa } from "../lib/money";
import { isPositiveAmount, isRealDate } from "../lib/validation";
import { sendNotFound, sendValidationError } from "../lib/http";

export const transactionsRouter = Router();

// Every route in this file needs a logged in user.
transactionsRouter.use(requireAuth);

const createSchema = z.object({
  kind: z.enum(["income", "expense"], { message: "Choose income or expense" }),
  amount: z
    .union([z.string(), z.number()], { message: "Enter an amount" })
    .refine(isPositiveAmount, "Enter an amount above zero, with up to 2 decimals"),
  category: z.string().trim().min(1, "Pick a category").max(40, "Category is too long").toLowerCase(),
  note: z.string().trim().max(200, "Note is too long").optional(),
  occurredOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
    .refine(isRealDate, "That date does not exist")
    .optional(),
});

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const idSchema = z.object({ id: z.uuid("That is not a valid id") });

const COLUMNS = `id, kind, amount, category, note,
  to_char(occurred_on, 'YYYY-MM-DD') AS occurred_on, created_at`;

type Row = {
  id: string;
  kind: "income" | "expense";
  amount: string;
  category: string;
  note: string | null;
  occurred_on: string;
  created_at: Date;
};

function toTransaction(row: Row) {
  return {
    id: row.id,
    kind: row.kind,
    amount: row.amount,
    category: row.category,
    note: row.note,
    occurredOn: row.occurred_on,
    createdAt: row.created_at,
  };
}

transactionsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const user = res.locals.user as AuthUser;
  const { kind, amount, category, note, occurredOn } = parsed.data;
  const amountText = paisaToRupees(rupeesToPaisa(amount));

  const { rows } = await pool.query<Row>(
    `INSERT INTO transactions (user_id, kind, amount, category, note, occurred_on)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE))
     RETURNING ${COLUMNS}`,
    [user.id, kind, amountText, category, note ? note : null, occurredOn ?? null],
  );

  res.status(201).json({ transaction: toTransaction(rows[0]) });
});

transactionsRouter.get("/", async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const user = res.locals.user as AuthUser;
  const { limit, offset } = parsed.data;

  const { rows } = await pool.query<Row>(
    `SELECT ${COLUMNS}
       FROM transactions
      WHERE user_id = $1
      ORDER BY occurred_on DESC, created_at DESC
      LIMIT $2 OFFSET $3`,
    [user.id, limit, offset],
  );

  res.json({ transactions: rows.map(toTransaction) });
});

transactionsRouter.delete("/:id", async (req, res) => {
  const parsed = idSchema.safeParse(req.params);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const user = res.locals.user as AuthUser;
  const result = await pool.query(
    "DELETE FROM transactions WHERE id = $1 AND user_id = $2",
    [parsed.data.id, user.id],
  );

  if (result.rowCount === 0) {
    sendNotFound(res, "Transaction");
    return;
  }
  res.status(204).end();
});