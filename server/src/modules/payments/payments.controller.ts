import type { RequestHandler } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/appError.js";
import { logger } from "../../lib/logger.js";
import { stripe } from "../../lib/stripe.js";
import { createOrderSchema } from "../orders/orders.schema.js";
import { createCheckoutSession, handleStripeEvent } from "./payments.service.js";

export const createCheckoutSessionHandler: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  // The same body as a cash on delivery order: ids, quantities and the address. No prices.
  const input = createOrderSchema.parse(req.body);
  const result = await createCheckoutSession({ id: req.user.id, email: req.user.email }, input);

  res.status(201).json({ data: result });
};

// Called by Stripe, not by a browser. It has no login: the signature is the proof.
export const stripeWebhookHandler: RequestHandler = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (typeof signature !== "string") {
    throw new AppError(400, "Missing Stripe signature");
  }

  let event;

  try {
    // req.body is the raw body (a Buffer). The signature is checked on these exact bytes.
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    logger.warn({ err: error }, "Stripe webhook signature check failed");
    throw new AppError(400, "Invalid Stripe signature");
  }

  await handleStripeEvent(event);

  res.json({ received: true });
};
