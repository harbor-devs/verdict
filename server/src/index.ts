import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pool } from "./db";
import { authRouter } from "./routes/auth";
import { transactionsRouter } from "./routes/transactions";
import { verdictRouter } from "./routes/verdict";

const app = express();
const port = Number(process.env.PORT) || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "verdict" });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    res.json({ status: "ok", database: "connected", time: result.rows[0].now });
  } catch (error) {
    console.error("Database check failed:", error);
    res.status(500).json({ status: "error", database: "unreachable" });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/verdict", verdictRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: { code: "not_found", message: "Route not found." } });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (typeof error === "object" && error !== null && "type" in error && error.type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "bad_json", message: "Request body is not valid JSON." } });
    return;
  }
  console.error("Unhandled error:", error);
  res.status(500).json({ error: { code: "server_error", message: "Something went wrong on our side." } });
});

app.listen(port, () => {
  console.log(`VERDICT server running on http://localhost:${port}`);
});