import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
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

type ProductOptions = { id?: string; stock: number; priceCents?: number; isActive?: boolean };

async function createProduct(options: ProductOptions) {
  const key = randomUUID().slice(0, 8);

  return prisma.product.create({
    data: {
      ...(options.id ? { id: options.id } : {}),
      name: `Order product ${suffix}-${key}`,
      slug: `order-product-${suffix}-${key}`,
      description: "Created by a test",
      priceCents: options.priceCents ?? 1999,
      stock: options.stock,
      isActive: options.isActive ?? true,
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

beforeAll(async () => {
  const category = await prisma.category.create({
    data: { name: `Test orders ${suffix}`, slug: `test-orders-${suffix}` },
  });
  categoryId = category.id;
});

afterAll(async () => {
  // The orders go first (with the users), then the products they point to, then the category.
  await cleanupUsers();
  await prisma.product.deleteMany({ where: { categoryId } });
  await prisma.category.delete({ where: { id: categoryId } });
  await prisma.$disconnect();
});

describe("creating an order", () => {
  it("uses the real prices, ignores the client prices and reduces the stock", async () => {
    const product = await createProduct({ stock: 5, priceCents: 1999 });
    const { agent } = await registerUser("order-total");

    const res = await agent.post("/api/orders").send({
      // The client tries to pay 1 cent. Zod removes this field, and the server uses the database.
      items: [{ productId: product.id, quantity: 2, priceCents: 1 }],
      shipping,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.totalCents).toBe(3998);
    expect(res.body.data.items[0].priceCents).toBe(1999);
    expect(res.body.data.status).toBe("PENDING");
    expect(res.body.data.paymentMethod).toBe("COD");
    expect(res.body.data.paymentStatus).toBe("UNPAID");
    expect(res.body.data).not.toHaveProperty("userId");
    expect(res.body.data).not.toHaveProperty("stripeSessionId");
    expect(await stockOf(product.id)).toBe(3);
  });

  it("refuses to order more than the stock and changes nothing", async () => {
    const product = await createProduct({ stock: 2 });
    const { agent, email } = await registerUser("order-too-many");

    const res = await agent
      .post("/api/orders")
      .send({ items: [{ productId: product.id, quantity: 3 }], shipping });

    expect(res.status).toBe(409);
    expect(await stockOf(product.id)).toBe(2);
    expect(await prisma.order.count({ where: { user: { email } } })).toBe(0);
  });

  it("does not oversell the last item when two orders arrive at the same time", async () => {
    const product = await createProduct({ stock: 1 });
    const userA = await registerUser("order-race-a");
    const userB = await registerUser("order-race-b");
    const body = { items: [{ productId: product.id, quantity: 1 }], shipping };

    const [resA, resB] = await Promise.all([
      userA.agent.post("/api/orders").send(body),
      userB.agent.post("/api/orders").send(body),
    ]);

    expect([resA.status, resB.status].sort()).toEqual([201, 409]);
    expect(await stockOf(product.id)).toBe(0);
  });

  it("undoes everything when one line of the order fails", async () => {
    // The ids are chosen so that the first product is handled before the failing one.
    const first = await createProduct({ id: `00000000-0000-4000-8000-${suffix}0001`, stock: 5 });
    const second = await createProduct({ id: `ffffffff-ffff-4fff-8fff-${suffix}0002`, stock: 1 });
    const { agent } = await registerUser("order-rollback");

    const res = await agent.post("/api/orders").send({
      items: [
        { productId: first.id, quantity: 2 },
        { productId: second.id, quantity: 2 },
      ],
      shipping,
    });

    expect(res.status).toBe(409);
    expect(await stockOf(first.id)).toBe(5);
    expect(await stockOf(second.id)).toBe(1);
  });

  it("refuses unknown and inactive products", async () => {
    const inactive = await createProduct({ stock: 5, isActive: false });
    const { agent } = await registerUser("order-unavailable");

    const unknown = await agent
      .post("/api/orders")
      .send({ items: [{ productId: randomUUID(), quantity: 1 }], shipping });
    const hidden = await agent
      .post("/api/orders")
      .send({ items: [{ productId: inactive.id, quantity: 1 }], shipping });

    expect(unknown.status).toBe(404);
    expect(hidden.status).toBe(404);
    expect(await stockOf(inactive.id)).toBe(5);
  });

  it.each([
    { name: "an empty list of items", body: { items: [], shipping } },
    {
      name: "a quantity above the maximum",
      body: { items: [{ productId: randomUUID(), quantity: 11 }], shipping },
    },
    {
      name: "a missing shipping address",
      body: { items: [{ productId: randomUUID(), quantity: 1 }] },
    },
  ])("rejects $name", async ({ body }) => {
    const { agent } = await registerUser("order-invalid");

    const res = await agent.post("/api/orders").send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Validation failed");
  });
});

describe("order access", () => {
  it("rejects a visitor", async () => {
    const create = await request(app).post("/api/orders").send({});
    const list = await request(app).get("/api/orders");

    expect(create.status).toBe(401);
    expect(list.status).toBe(401);
  });

  it("keeps each customer's orders private", async () => {
    const product = await createProduct({ stock: 5 });
    const owner = await registerUser("order-owner");
    const intruder = await registerUser("order-intruder");

    const created = await owner.agent
      .post("/api/orders")
      .send({ items: [{ productId: product.id, quantity: 1 }], shipping });
    const orderId: string = created.body.data.id;

    const read = await intruder.agent.get(`/api/orders/${orderId}`);
    const list = await intruder.agent.get("/api/orders");
    const cancel = await intruder.agent.post(`/api/orders/${orderId}/cancel`);
    const stored = await prisma.order.findUnique({ where: { id: orderId } });

    expect(read.status).toBe(404);
    expect(list.body.data).toEqual([]);
    expect(cancel.status).toBe(404);
    expect(stored?.status).toBe("PENDING");
  });
});

describe("cancelling an order", () => {
  it("restores the stock, and only once", async () => {
    const product = await createProduct({ stock: 5 });
    const { agent } = await registerUser("order-cancel");

    const created = await agent
      .post("/api/orders")
      .send({ items: [{ productId: product.id, quantity: 2 }], shipping });
    const orderId: string = created.body.data.id;
    expect(await stockOf(product.id)).toBe(3);

    const first = await agent.post(`/api/orders/${orderId}/cancel`);
    expect(first.status).toBe(200);
    expect(first.body.data.status).toBe("CANCELLED");
    expect(await stockOf(product.id)).toBe(5);

    const second = await agent.post(`/api/orders/${orderId}/cancel`);
    expect(second.status).toBe(409);
    expect(await stockOf(product.id)).toBe(5);
  });
});
