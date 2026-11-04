import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { pool } from "../db";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "../auth/passwords";
import { createSession, destroySession, requireAuth, toAuthUser } from "../auth/session";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: "rate_limited", message: "Too many attempts. Try again in a few minutes." },
  },
});

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email is too long")
  .email("Enter a valid email");

const signupSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128, "Password is too long"),
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(50, "Name is too long"),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(128, "Password is too long"),
});

function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}

authRouter.post("/signup", authLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "validation_failed",
        message: "Check the highlighted fields.",
        fields: fieldErrors(parsed.error),
      },
    });
    return;
  }

  const { email, password, displayName } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, currency`,
      [email, passwordHash, displayName],
    );
    const user = toAuthUser(rows[0]);
    await createSession(user.id, res);
    res.status(201).json({ user });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      res.status(409).json({
        error: {
          code: "email_taken",
          message: "That email is already registered.",
          fields: { email: "That email is already registered." },
        },
      });
      return;
    }
    throw error;
  }
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "validation_failed",
        message: "Check the highlighted fields.",
        fields: fieldErrors(parsed.error),
      },
    });
    return;
  }

  const { email, password } = parsed.data;
  const { rows } = await pool.query(
    `SELECT id, email, display_name, currency, password_hash
       FROM users
      WHERE lower(email) = $1`,
    [email],
  );
  const found = rows[0];

  let ok = false;
  if (found) {
    ok = await verifyPassword(password, found.password_hash);
  } else {
    await verifyAgainstDummy(password);
  }

  if (!found || !ok) {
    res.status(401).json({
      error: { code: "invalid_credentials", message: "Email or password is wrong." },
    });
    return;
  }

  const user = toAuthUser(found);
  await createSession(user.id, res);
  res.json({ user });
});

authRouter.post("/logout", async (req, res) => {
  await destroySession(req, res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (_req, res) => {
  res.json({ user: res.locals.user });
});