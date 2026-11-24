import { Router } from "express";
import { z } from "zod";
import { getSalesPerDay, getStats } from "./adminStats.service.js";

const salesQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(90).default(30),
});

export const adminStatsRouter = Router();

adminStatsRouter.get("/", async (_req, res) => {
  res.json({ data: await getStats() });
});

adminStatsRouter.get("/sales", async (req, res) => {
  const { days } = salesQuerySchema.parse(req.query);

  res.json({ data: await getSalesPerDay(days) });
});
