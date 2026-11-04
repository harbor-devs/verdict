import { createHash, randomBytes } from "node:crypto";
import type { CookieOptions, NextFunction, Request, Response } from "express";
import { pool } from "../db";

export const COOKIE_NAME = "verdict_sid";
const SESSION_DAYS = 7;

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  currency: string;
};

const baseCookie: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function toAuthUser(row: {
  id: string;
  email: string;
  display_name: string;
  currency: string;
}): AuthUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    currency: row.currency,
  };
}

export async function createSession(userId: string, res: Response): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await pool.query(
    "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, hashToken(token), expiresAt],
  );
  // Housekeeping: remove expired sessions
  await pool.query("DELETE FROM sessions WHERE expires_at < now()");

  res.cookie(COOKIE_NAME, token, { ...baseCookie, expires: expiresAt });
}

export async function destroySession(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME];
  if (typeof token === "string") {
    await pool.query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
  }
  res.clearCookie(COOKIE_NAME, baseCookie);
}

function unauthorized(res: Response): void {
  res.status(401).json({
    error: { code: "unauthorized", message: "You need to log in first." },
  });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME];
  if (typeof token !== "string") {
    unauthorized(res);
    return;
  }

  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.display_name, u.currency
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)],
  );

  if (rows.length === 0) {
    res.clearCookie(COOKIE_NAME, baseCookie);
    unauthorized(res);
    return;
  }

  res.locals.user = toAuthUser(rows[0]);
  next();
}