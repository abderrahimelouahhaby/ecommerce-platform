import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";
import { stripe } from "../src/lib/stripe.js";
import { cleanupUsers, registerUser } from "./helpers/users.js";

const suffix = randomUUID().slice(0, 8);
let categoryId = "";

const shipping = {
  name: "Test Customer",
  phone: "+212 600 000 000",
  address: "12 Test Street",
  city: "Casablanca",
  postalCode: "20000",
  country: "Morocco",
};

afterEach(() => {
  vi.restoreAllMocks();
});

beforeAll(async () => {
  const category = await prisma.category.create({
    data: { name: `Test payments ${suffix}`, slug: `test-payments-${suffix}` },
  });
  categoryId = category.id;
});

afterAll(async () => {
  await cleanupUsers();
  await prisma.product.deleteMany({ where: { categoryId } });
  await prisma.category.delete({ where: { id: categoryId } });
  await prisma.$disconnect();
});

async function createProduct(stock: number, priceCents = 1999) {
  const key = randomUUID().slice(0, 8);

  return prisma.product.create({
    data: {
      name: `Payment product ${suffix}-${key}`,
      slug: `payment-product-${suffix}-${key}`,
      description: "Created by a test",
      priceCents,
      stock,
      categoryId,
    },
  });
}

async function stockOf(productId: string): Promise<number | undefined> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });

  return product?.stock;
}

// An order that waits for a card payment, like the one made by the checkout session route.
async function createPendingCardOrder(
  email: string,
  product: { id: string; priceCents: number },
  quantity: number,
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const sessionId = `cs_test_${randomUUID().replace(/-/g, "")}`;

  await prisma.product.update({
    where: { id: product.id },
    data: { stock: { decrement: quantity } },
  });

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      status: "PENDING",
      paymentMethod: "CARD",
      paymentStatus: "UNPAID",
      totalCents: product.priceCents * quantity,
      shippingName: shipping.name,
      shippingPhone: shipping.phone,
      shippingAddress: shipping.address,
      shippingCity: shipping.city,
      shippingPostalCode: shipping.postalCode,
      shippingCountry: shipping.country,
      stripeSessionId: sessionId,
      items: {
        create: [
          {
            productId: product.id,
            productName: "Test product",
            priceCents: product.priceCents,
            quantity,
          },
        ],
      },
    },
  });

  return { order, sessionId };
}

function sessionEvent(type: string, session: Record<string, unknown>) {
  return {
    id: `evt_test_${randomUUID().replace(/-/g, "")}`,
    object: "event",
    created: Math.floor(Date.now() / 1000),
    type,
    data: { object: { object: "checkout.session", ...session } },
  };
}

// Sends an event to the webhook, signed like Stripe would sign it.
function sendWebhook(event: object, secret = env.STRIPE_WEBHOOK_SECRET) {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });

  return request(app)
    .post("/api/payments/webhook")
    .set("Content-Type", "application/json")
    .set("Stripe-Signature", signature)
    .send(payload);
}

describe("stripe webhook security", () => {
  it("rejects a request without a signature and changes nothing", async () => {
    const product = await createProduct(5);
    const { email } = await registerUser("pay-no-signature");
    const { order, sessionId } = await createPendingCardOrder(email, product, 1);
    const event = sessionEvent("checkout.session.completed", {
      id: sessionId,
      payment_status: "paid",
      amount_total: order.totalCents,
      currency: "usd",
    });

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .send(JSON.stringify(event));

    const stored = await prisma.order.findUnique({ where: { id: order.id } });

    expect(res.status).toBe(400);
    expect(stored?.status).toBe("PENDING");
  });

  it("rejects a request signed with another secret and changes nothing", async () => {
    const product = await createProduct(5);
    const { email } = await registerUser("pay-wrong-secret");
    const { order, sessionId } = await createPendingCardOrder(email, product, 1);
    const event = sessionEvent("checkout.session.completed", {
      id: sessionId,
      payment_status: "paid",
      amount_total: order.totalCents,
      currency: "usd",
    });

    const res = await sendWebhook(event, "whsec_a_secret_that_is_not_ours");

    const stored = await prisma.order.findUnique({ where: { id: order.id } });

    expect(res.status).toBe(400);
    expect(stored?.status).toBe("PENDING");
  });
});

describe("stripe webhook events", () => {
  it("marks the order as paid, and survives the same event twice", async () => {
    const product = await createProduct(5);
    const { email } = await registerUser("pay-paid");
    const { order, sessionId } = await createPendingCardOrder(email, product, 2);
    const event = sessionEvent("checkout.session.completed", {
      id: sessionId,
      payment_status: "paid",
      amount_total: order.totalCents,
      currency: "usd",
    });

    const first = await sendWebhook(event);
    const second = await sendWebhook(event);
    const stored = await prisma.order.findUnique({ where: { id: order.id } });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(stored?.status).toBe("PAID");
    expect(stored?.paymentStatus).toBe("PAID");
  });

  it("does not mark the order as paid when the amount is wrong", async () => {
    const product = await createProduct(5);
    const { email } = await registerUser("pay-amount");
    const { order, sessionId } = await createPendingCardOrder(email, product, 1);
    const event = sessionEvent("checkout.session.completed", {
      id: sessionId,
      payment_status: "paid",
      amount_total: 1,
      currency: "usd",
    });

    const res = await sendWebhook(event);
    const stored = await prisma.order.findUnique({ where: { id: order.id } });

    expect(res.status).toBe(200);
    expect(stored?.status).toBe("PENDING");
    expect(stored?.paymentStatus).toBe("UNPAID");
  });

  it("cancels the order and restores the stock once when the session expires", async () => {
    const product = await createProduct(5);
    const { email } = await registerUser("pay-expired");
    const { order, sessionId } = await createPendingCardOrder(email, product, 2);
    const event = sessionEvent("checkout.session.expired", { id: sessionId });
    expect(await stockOf(product.id)).toBe(3);

    await sendWebhook(event);
    const stored = await prisma.order.findUnique({ where: { id: order.id } });

    expect(stored?.status).toBe("CANCELLED");
    expect(stored?.paymentStatus).toBe("FAILED");
    expect(await stockOf(product.id)).toBe(5);

    await sendWebhook(event);

    expect(await stockOf(product.id)).toBe(5);
  });

  it("never cancels an order that is already paid", async () => {
    const product = await createProduct(5);
    const { email } = await registerUser("pay-paid-then-expired");
    const { order, sessionId } = await createPendingCardOrder(email, product, 1);

    await sendWebhook(
      sessionEvent("checkout.session.completed", {
        id: sessionId,
        payment_status: "paid",
        amount_total: order.totalCents,
        currency: "usd",
      }),
    );
    await sendWebhook(sessionEvent("checkout.session.expired", { id: sessionId }));

    const stored = await prisma.order.findUnique({ where: { id: order.id } });

    expect(stored?.status).toBe("PAID");
    expect(await stockOf(product.id)).toBe(4);
  });
});

describe("checkout session", () => {
  it("rejects a visitor", async () => {
    const res = await request(app).post("/api/payments/checkout-session").send({});

    expect(res.status).toBe(401);
  });

  it("builds the Stripe session from the database prices and saves its id", async () => {
    const product = await createProduct(5, 1999);
    const { agent, email } = await registerUser("pay-session");
    const sessionId = `cs_test_${randomUUID().replace(/-/g, "")}`;
    const createSession = vi
      .spyOn(stripe.checkout.sessions, "create")
      .mockResolvedValue({
        id: sessionId,
        url: `https://checkout.stripe.test/${sessionId}`,
      } as never);

    const res = await agent.post("/api/payments/checkout-session").send({
      // The client tries to pay 1 cent. The server ignores it.
      items: [{ productId: product.id, quantity: 2, priceCents: 1 }],
      shipping,
    });

    const params = createSession.mock.calls[0]?.[0];
    const order = await prisma.order.findFirst({ where: { user: { email } } });

    expect(res.status).toBe(201);
    expect(res.body.data.url).toContain(sessionId);
    expect(params?.line_items?.[0]?.price_data?.unit_amount).toBe(1999);
    expect(params?.line_items?.[0]?.quantity).toBe(2);
    expect(params?.client_reference_id).toBe(order?.id);
    expect(order?.paymentMethod).toBe("CARD");
    expect(order?.status).toBe("PENDING");
    expect(order?.totalCents).toBe(3998);
    expect(order?.stripeSessionId).toBe(sessionId);
    expect(await stockOf(product.id)).toBe(3);
  });

  it("cancels the order and restores the stock when Stripe is down", async () => {
    const product = await createProduct(5);
    const { agent, email } = await registerUser("pay-stripe-down");
    vi.spyOn(stripe.checkout.sessions, "create").mockRejectedValue(new Error("Stripe is down"));

    const res = await agent
      .post("/api/payments/checkout-session")
      .send({ items: [{ productId: product.id, quantity: 2 }], shipping });

    const order = await prisma.order.findFirst({ where: { user: { email } } });

    expect(res.status).toBe(502);
    expect(order?.status).toBe("CANCELLED");
    expect(await stockOf(product.id)).toBe(5);
  });
});
