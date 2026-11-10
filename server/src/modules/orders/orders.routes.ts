import { Router } from "express";
import { env } from "../../config/env.js";
import { createRateLimiter } from "../../middleware/rateLimit.js";
import {
  cancelOrderHandler,
  createOrderHandler,
  getOrderHandler,
  listOrdersHandler,
} from "./orders.controller.js";

export const ordersRouter = Router();

// A customer does not need many orders in a short time. This slows down abuse.
const createOrderLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skip: () => env.NODE_ENV === "test",
});

ordersRouter.post("/", createOrderLimiter, createOrderHandler);
ordersRouter.get("/", listOrdersHandler);
ordersRouter.get("/:id", getOrderHandler);
ordersRouter.post("/:id/cancel", cancelOrderHandler);
