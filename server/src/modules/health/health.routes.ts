import { Router } from "express";
import { AppError } from "../../lib/appError.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";

export const healthRouter = Router();

// Is the server running?
healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Can the server reach the database?
healthRouter.get("/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    logger.error({ err: error }, "Database health check failed");
    throw new AppError(503, "Database unavailable");
  }

  res.json({ status: "ok", database: "up" });
});
