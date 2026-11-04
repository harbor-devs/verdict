import "dotenv/config";
import express from "express";
import { pool } from "./db";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(express.json());

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

app.listen(port, () => {
  console.log(`VERDICT server running on http://localhost:${port}`);
});