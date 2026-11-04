import "dotenv/config";
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "verdict" });
});

app.listen(port, () => {
  console.log(`VERDICT server running on http://localhost:${port}`);
});