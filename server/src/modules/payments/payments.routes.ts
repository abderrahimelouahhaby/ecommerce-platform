import { Router } from "express";
import { env } from "../../config/env.js";
import { createRateLimiter } from "../../middleware/rateLimit.js";
import { createCheckoutSessionHandler } from "./payments.controller.js";

export const paymentsRouter = Router();

// Each checkout session reserves stock, so it has the same limit as creating an order.
const checkoutLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skip: () => env.NODE_ENV === "test",
});

paymentsRouter.post("/checkout-session", checkoutLimiter, createCheckoutSessionHandler);
