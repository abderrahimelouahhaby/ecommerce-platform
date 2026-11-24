import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { uploadProductImage } from "../src/lib/cloudinary.js";
import { prisma } from "../src/lib/prisma.js";
import { cleanupUsers, makeAdmin, registerUser } from "./helpers/users.js";

// The tests never call the real Cloudinary.
vi.mock("../src/lib/cloudinary.js", () => ({
  uploadProductImage: vi.fn(),
  deleteProductImage: vi.fn(),
}));

const suffix = randomUUID().slice(0, 8);
let categoryId = "";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

beforeAll(async () => {
  const category = await prisma.category.create({
    data: { name: `Test admin ${suffix}`, slug: `test-admin-${suffix}` },
  });
  categoryId = category.id;
});

beforeEach(() => {
  vi.mocked(uploadProductImage).mockReset().mockResolvedValue({
    url: "https://res.cloudinary.test/photo.png",
    publicId: "ecommerce/products/test-photo",
  });
});

afterAll(async () => {
  await cleanupUsers();
  await prisma.product.deleteMany({ where: { categoryId } });
  await prisma.category.delete({ where: { id: categoryId } });
  await prisma.$disconnect();
});

async function loginAsAdmin(label = "admin") {
  const user = await registerUser(label);
  await makeAdmin(user.email);

  return user;
}

async function createProductRow(overrides: { stock?: number; isActive?: boolean } = {}) {
  const key = randomUUID().slice(0, 8);

  return prisma.product.create({
    data: {
      name: `Admin product ${suffix}-${key}`,
      slug: `admin-product-${suffix}-${key}`,
      description: "Created by a test",
      priceCents: 1999,
      stock: overrides.stock ?? 5,
      isActive: overrides.isActive ?? true,
      categoryId,
    },
  });
}

async function createOrderRow(options: {
  email: string;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: "COD" | "CARD";
  totalCents: number;
}) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: options.email } });

  return prisma.order.create({
    data: {
      userId: user.id,
      status: options.status,
      paymentMethod: options.paymentMethod,
      paymentStatus: options.status === "PAID" ? "PAID" : "UNPAID",
      totalCents: options.totalCents,
      shippingName: "Test Customer",
      shippingPhone: "+212 600 000 000",
      shippingAddress: "12 Test Street",
      shippingCity: "Casablanca",
      shippingPostalCode: "20000",
      shippingCountry: "Morocco",
    },
  });
}

const someId = randomUUID();
const adminRoutes = [
  ["get", "/api/admin/products"],
  ["post", "/api/admin/products"],
  ["patch", `/api/admin/products/${someId}`],
  ["delete", `/api/admin/products/${someId}`],
  ["get", "/api/admin/orders"],
  ["patch", `/api/admin/orders/${someId}/status`],
  ["get", "/api/admin/users"],
  ["patch", `/api/admin/users/${someId}/role`],
  ["get", "/api/admin/stats"],
  ["get", "/api/admin/stats/sales"],
  ["get", "/api/admin/inventory"],
  ["patch", `/api/admin/inventory/${someId}`],
] as const;

describe("admin access", () => {
  it("refuses a visitor on every admin route", async () => {
    for (const [method, path] of adminRoutes) {
      const res = await request(app)[method](path);

      expect(res.status, `${method} ${path}`).toBe(401);
    }
  });

  it("refuses a customer on every admin route", async () => {
    const { agent } = await registerUser("not-admin");

    for (const [method, path] of adminRoutes) {
      const res = await agent[method](path);

      expect(res.status, `${method} ${path}`).toBe(403);
    }
  });
});

describe("admin products", () => {
  it("creates a product with an uploaded image and a slug made by the server", async () => {
    const { agent } = await loginAsAdmin("admin-create");

    const res = await agent
      .post("/api/admin/products")
      .field("name", `Gadget ${suffix}`)
      .field("description", "A product created by a test.")
      .field("priceCents", "1999")
      .field("stock", "5")
      .field("categoryId", categoryId)
      .attach("image", Buffer.concat([PNG_SIGNATURE, Buffer.alloc(32)]), {
        filename: "photo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe(`gadget-${suffix}`);
    expect(res.body.data.priceCents).toBe(1999);
    expect(res.body.data.imageUrl).toBe("https://res.cloudinary.test/photo.png");
    expect(res.body.data).not.toHaveProperty("imagePublicId");

    const stored = await prisma.product.findUnique({ where: { id: res.body.data.id } });
    expect(stored?.imagePublicId).toBe("ecommerce/products/test-photo");
  });

  it("refuses a file that is not an image, even with an image name and type", async () => {
    const { agent } = await loginAsAdmin("admin-fake-image");

    const res = await agent
      .post("/api/admin/products")
      .field("name", `Fake image ${suffix}`)
      .field("description", "A product with a fake image.")
      .field("priceCents", "1000")
      .field("stock", "1")
      .field("categoryId", categoryId)
      .attach("image", Buffer.from('<svg onload="alert(1)"></svg>'), {
        filename: "evil.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(uploadProductImage).not.toHaveBeenCalled();
    expect(await prisma.product.count({ where: { name: `Fake image ${suffix}` } })).toBe(0);
  });

  it("refuses an image that is too large", async () => {
    const { agent } = await loginAsAdmin("admin-big-image");

    const res = await agent
      .post("/api/admin/products")
      .field("name", `Big image ${suffix}`)
      .field("description", "A product with a huge image.")
      .field("priceCents", "1000")
      .field("stock", "1")
      .field("categoryId", categoryId)
      .attach("image", Buffer.concat([PNG_SIGNATURE, Buffer.alloc(2 * 1024 * 1024)]), {
        filename: "big.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(uploadProductImage).not.toHaveBeenCalled();
  });

  it("deactivates a product instead of deleting it", async () => {
    const { agent } = await loginAsAdmin("admin-deactivate");
    const product = await createProductRow();

    const res = await agent.delete(`/api/admin/products/${product.id}`);
    const stored = await prisma.product.findUnique({ where: { id: product.id } });
    const shop = await request(app).get(`/api/products/${product.slug}`);

    expect(res.status).toBe(204);
    expect(stored?.isActive).toBe(false);
    expect(shop.status).toBe(404);
  });
});

describe("admin orders", () => {
  it("ships and delivers a cash order, and marks it as paid on delivery", async () => {
    const { agent } = await loginAsAdmin("admin-ship");
    const customer = await registerUser("customer-ship");
    const order = await createOrderRow({
      email: customer.email,
      status: "PENDING",
      paymentMethod: "COD",
      totalCents: 3000,
    });

    const shipped = await agent
      .patch(`/api/admin/orders/${order.id}/status`)
      .send({ status: "SHIPPED" });
    const delivered = await agent
      .patch(`/api/admin/orders/${order.id}/status`)
      .send({ status: "DELIVERED" });

    expect(shipped.status).toBe(200);
    expect(shipped.body.data.status).toBe("SHIPPED");
    expect(delivered.status).toBe(200);
    expect(delivered.body.data.status).toBe("DELIVERED");
    expect(delivered.body.data.paymentStatus).toBe("PAID");
  });

  it("refuses impossible status changes", async () => {
    const { agent } = await loginAsAdmin("admin-transitions");
    const customer = await registerUser("customer-transitions");
    const unpaidCard = await createOrderRow({
      email: customer.email,
      status: "PENDING",
      paymentMethod: "CARD",
      totalCents: 3000,
    });
    const pendingCash = await createOrderRow({
      email: customer.email,
      status: "PENDING",
      paymentMethod: "COD",
      totalCents: 3000,
    });

    const shipUnpaid = await agent
      .patch(`/api/admin/orders/${unpaidCard.id}/status`)
      .send({ status: "SHIPPED" });
    const deliverTooEarly = await agent
      .patch(`/api/admin/orders/${pendingCash.id}/status`)
      .send({ status: "DELIVERED" });
    const markPaidByHand = await agent
      .patch(`/api/admin/orders/${unpaidCard.id}/status`)
      .send({ status: "PAID" });

    expect(shipUnpaid.status).toBe(409);
    expect(deliverTooEarly.status).toBe(409);
    expect(markPaidByHand.status).toBe(400);
  });
});

describe("admin users", () => {
  it("changes the role of another user", async () => {
    const { agent } = await loginAsAdmin("admin-roles");
    const target = await registerUser("target-role");
    const stored = await prisma.user.findUniqueOrThrow({ where: { email: target.email } });

    const res = await agent.patch(`/api/admin/users/${stored.id}/role`).send({ role: "ADMIN" });
    const updated = await prisma.user.findUnique({ where: { id: stored.id } });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("ADMIN");
    expect(updated?.role).toBe("ADMIN");
  });

  it("does not let an admin change their own role", async () => {
    const { agent, email } = await loginAsAdmin("admin-self");
    const self = await prisma.user.findUniqueOrThrow({ where: { email } });

    const res = await agent.patch(`/api/admin/users/${self.id}/role`).send({ role: "USER" });
    const stored = await prisma.user.findUnique({ where: { id: self.id } });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("You cannot change your own role");
    expect(stored?.role).toBe("ADMIN");
  });
});

describe("admin stats and inventory", () => {
  it("counts only confirmed sales in the revenue", async () => {
    const { agent } = await loginAsAdmin("admin-stats");
    const customer = await registerUser("customer-stats");
    const before = await agent.get("/api/admin/stats");

    const orders = [
      { status: "PAID", paymentMethod: "CARD", totalCents: 3000 },
      { status: "SHIPPED", paymentMethod: "COD", totalCents: 2000 },
      { status: "DELIVERED", paymentMethod: "COD", totalCents: 1000 },
      { status: "CANCELLED", paymentMethod: "CARD", totalCents: 5000 },
      { status: "PENDING", paymentMethod: "COD", totalCents: 7000 },
    ] as const;

    for (const order of orders) {
      await createOrderRow({ email: customer.email, ...order });
    }

    const after = await agent.get("/api/admin/stats");

    expect(after.body.data.revenueCents - before.body.data.revenueCents).toBe(6000);
    expect(after.body.data.salesCount - before.body.data.salesCount).toBe(3);
    expect(after.body.data.pendingCount - before.body.data.pendingCount).toBe(1);
  });

  it("returns every day of the period, with the sales of today", async () => {
    const { agent } = await loginAsAdmin("admin-sales-per-day");
    const customer = await registerUser("customer-sales-per-day");
    const before = await agent.get("/api/admin/stats/sales?days=7");

    await createOrderRow({
      email: customer.email,
      status: "PAID",
      paymentMethod: "CARD",
      totalCents: 3000,
    });

    const after = await agent.get("/api/admin/stats/sales?days=7");
    const today = new Date().toISOString().slice(0, 10);
    const dates: string[] = after.body.data.map((day: { date: string }) => day.date);
    const lastBefore = before.body.data[6];
    const lastAfter = after.body.data[6];

    expect(after.body.data).toHaveLength(7);
    expect(dates).toEqual([...dates].sort());
    expect(lastAfter.date).toBe(today);
    expect(lastAfter.revenueCents - lastBefore.revenueCents).toBe(3000);

    const tooMany = await agent.get("/api/admin/stats/sales?days=500");
    expect(tooMany.status).toBe(400);
  });

  it("sets a stock, and refuses a negative one", async () => {
    const { agent } = await loginAsAdmin("admin-stock");
    const product = await createProductRow({ stock: 2 });

    const ok = await agent.patch(`/api/admin/inventory/${product.id}`).send({ stock: 7 });
    const negative = await agent.patch(`/api/admin/inventory/${product.id}`).send({ stock: -1 });
    const stored = await prisma.product.findUnique({ where: { id: product.id } });

    expect(ok.status).toBe(200);
    expect(negative.status).toBe(400);
    expect(stored?.stock).toBe(7);
  });
});
