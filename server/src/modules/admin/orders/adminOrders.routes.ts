import { Router } from "express";
import { z } from "zod";
import { logAdminAction } from "../../../lib/audit.js";
import { getUserId } from "../../../lib/currentUser.js";
import { paginationShape } from "../../../lib/pagination.js";
import { idParamsSchema } from "../../../lib/params.js";
import { changeOrderStatus, listAdminOrders } from "./adminOrders.service.js";

const listQuerySchema = z.object({
  ...paginationShape,
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
});

// Only these two values are accepted. PAID and CANCELLED are decided by Stripe and by customers.
const statusBodySchema = z.object({ status: z.enum(["SHIPPED", "DELIVERED"]) });

export const adminOrdersRouter = Router();

adminOrdersRouter.get("/", async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  const { items, pagination } = await listAdminOrders(query);

  res.json({ data: items, pagination });
});

adminOrdersRouter.patch("/:id/status", async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const { status } = statusBodySchema.parse(req.body);
  const order = await changeOrderStatus(id, status);

  logAdminAction(getUserId(req), "order.status", { orderId: id, status });
  res.json({ data: order });
});
