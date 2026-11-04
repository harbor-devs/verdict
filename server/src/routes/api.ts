import { Router } from "express";
import { authRouter } from "./auth";
import { budgetsRouter } from "./budgets";
import { transactionsRouter } from "./transactions";
import { verdictRouter } from "./verdict";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/transactions", transactionsRouter);
apiRouter.use("/budgets", budgetsRouter);
apiRouter.use("/verdict", verdictRouter);