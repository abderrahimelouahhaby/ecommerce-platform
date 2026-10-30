import { Router } from "express";

export const adminRouter = Router();

// Every route in this router is already protected (see routes/index.ts).
// This route only exists to check the protection. Real admin routes come in part 14.
adminRouter.get("/ping", (_req, res) => {
  res.json({ status: "ok" });
});
