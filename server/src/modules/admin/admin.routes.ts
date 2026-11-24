import { Router } from "express";
import { adminInventoryRouter } from "./inventory/adminInventory.routes.js";
import { adminOrdersRouter } from "./orders/adminOrders.routes.js";
import { adminProductsRouter } from "./products/adminProducts.routes.js";
import { adminStatsRouter } from "./stats/adminStats.routes.js";
import { adminUsersRouter } from "./users/adminUsers.routes.js";

// The whole admin router is mounted behind requireAuth and requireAdmin (see routes/index.ts).
// Every route added here is protected automatically.
export const adminRouter = Router();

adminRouter.get("/ping", (_req, res) => {
  res.json({ status: "ok" });
});

adminRouter.use("/products", adminProductsRouter);
adminRouter.use("/orders", adminOrdersRouter);
adminRouter.use("/users", adminUsersRouter);
adminRouter.use("/stats", adminStatsRouter);
adminRouter.use("/inventory", adminInventoryRouter);
