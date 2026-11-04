import type { Response } from "express";
import type { ZodError } from "zod";

export function sendValidationError(res: Response, error: ZodError): void {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in fields)) fields[key] = issue.message;
  }
  res.status(400).json({
    error: {
      code: "validation_failed",
      message: "Check the highlighted fields.",
      fields,
    },
  });
}

export function sendNotFound(res: Response, what: string): void {
  res.status(404).json({
    error: { code: "not_found", message: `${what} not found.` },
  });
}