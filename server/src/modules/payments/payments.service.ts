import type Stripe from "stripe";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/appError.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { stripe } from "../../lib/stripe.js";
import type { CreateOrderInput } from "../orders/orders.schema.js";
import { cancelOrder, cancelUnpaidOrder, createOrder } from "../orders/orders.service.js";

type Customer = { id: string; email: string };

export async function createCheckoutSession(customer: Customer, input: CreateOrderInput) {
  // 1. A card order, with the stock reserved, exactly like a cash on delivery order.
  const order = await createOrder(customer.id, input, "CARD");

  try {
    // 2. The Stripe page is built from the order items, which hold the prices of the database.
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: order.id,
        customer_email: customer.email,
        line_items: order.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "usd",
            unit_amount: item.priceCents,
            product_data: { name: item.productName },
          },
        })),
        // Stripe wants at least 30 minutes. After that the session expires and the stock is released.
        expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
        success_url: `${env.CLIENT_URL}/checkout/success?order=${order.id}`,
        cancel_url: `${env.CLIENT_URL}/checkout/cancelled?order=${order.id}`,
      },
      // Sending the same request twice creates only one session.
      { idempotencyKey: `checkout-order-${order.id}` },
    );

    if (!session.url) {
      throw new Error("Stripe did not return a payment page address");
    }

    await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });

    return { orderId: order.id, url: session.url };
  } catch (error) {
    // The customer cannot pay, so the order is cancelled and the stock goes back on sale.
    logger.error({ err: error, orderId: order.id }, "Could not create the Stripe checkout session");
    await cancelOrder(customer.id, order.id);

    throw new AppError(502, "The payment service is unavailable. Please try again.");
  }
}

// Called after a customer cancels a card order: closes the Stripe page,
// so nobody can pay for an order that no longer exists.
export async function expireCheckoutSessionOf(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentMethod: true, stripeSessionId: true },
  });

  if (order?.paymentMethod !== "CARD" || !order.stripeSessionId) {
    return;
  }

  try {
    await stripe.checkout.sessions.expire(order.stripeSessionId);
  } catch (error) {
    logger.warn({ err: error, orderId }, "Could not expire the Stripe checkout session");
  }
}

async function markOrderPaid(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== "paid") {
    return;
  }

  // We find the order by the session id that WE saved, not by data inside the event.
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
    select: { id: true, status: true, totalCents: true },
  });

  if (!order) {
    logger.warn({ sessionId: session.id }, "Stripe session does not match any order");
    return;
  }

  // The amount paid must be exactly the amount of the order.
  if (session.amount_total !== order.totalCents || session.currency !== "usd") {
    logger.error(
      { orderId: order.id, expected: order.totalCents, received: session.amount_total },
      "Stripe amount does not match the order, the order was not marked as paid",
    );
    return;
  }

  // Safe to repeat: only a pending and unpaid order can become paid.
  const updated = await prisma.order.updateMany({
    where: { id: order.id, status: "PENDING", paymentStatus: "UNPAID" },
    data: { status: "PAID", paymentStatus: "PAID" },
  });

  if (updated.count === 0 && order.status === "CANCELLED") {
    logger.error(
      { orderId: order.id },
      "A payment was received for a cancelled order, refund needed",
    );
  }
}

async function cancelExpiredOrder(session: Stripe.Checkout.Session): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
    select: { id: true },
  });

  if (!order) {
    logger.warn({ sessionId: session.id }, "Stripe session does not match any order");
    return;
  }

  await cancelUnpaidOrder(order.id);
}

// The event has already been verified (signature) when it reaches this function.
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await markOrderPaid(event.data.object);
      break;
    case "checkout.session.expired":
      await cancelExpiredOrder(event.data.object);
      break;
    default:
      logger.debug({ type: event.type }, "Stripe event ignored");
  }
}
