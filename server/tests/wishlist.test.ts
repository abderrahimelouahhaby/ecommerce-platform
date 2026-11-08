import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { cleanupUsers, registerUser } from "./helpers/users.js";

const suffix = randomUUID().slice(0, 8);
let categoryId = "";
let activeProductId = "";
let hiddenProductId = "";

function productData(name: string, overrides: { isActive?: boolean } = {}) {
  return {
    name: `${name} ${suffix}`,
    slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${suffix}-${randomUUID().slice(0, 4)}`,
    description: "Created by a test",
    priceCents: 1000,
    stock: 5,
    categoryId,
    ...overrides,
  };
}

beforeAll(async () => {
  const category = await prisma.category.create({
    data: { name: `Test wishlist ${suffix}`, slug: `test-wishlist-${suffix}` },
  });
  categoryId = category.id;

  const active = await prisma.product.create({ data: productData("Wish active") });
  const hidden = await prisma.product.create({
    data: productData("Wish hidden", { isActive: false }),
  });
  activeProductId = active.id;
  hiddenProductId = hidden.id;
});

afterAll(async () => {
  // Deleting the users and the products also deletes their wishlist rows (Cascade).
  await cleanupUsers();
  await prisma.product.deleteMany({ where: { categoryId } });
  await prisma.category.delete({ where: { id: categoryId } });
  await prisma.$disconnect();
});

describe("wishlist access control", () => {
  it("rejects a visitor on every wishlist route", async () => {
    const path = `/api/wishlist/${activeProductId}`;

    const responses = await Promise.all([
      request(app).get("/api/wishlist"),
      request(app).post(path),
      request(app).delete(path),
    ]);

    for (const res of responses) {
      expect(res.status).toBe(401);
    }
  });

  it("keeps each user's wishlist private", async () => {
    const userA = await registerUser("wishlist-a");
    const userB = await registerUser("wishlist-b");

    await userA.agent.post(`/api/wishlist/${activeProductId}`);

    const listA = await userA.agent.get("/api/wishlist");
    const listB = await userB.agent.get("/api/wishlist");

    expect(listA.body.data).toHaveLength(1);
    expect(listB.body.data).toEqual([]);
  });

  it("does not let another user remove an item", async () => {
    const userA = await registerUser("wishlist-owner");
    const userB = await registerUser("wishlist-intruder");

    await userA.agent.post(`/api/wishlist/${activeProductId}`);
    const attempt = await userB.agent.delete(`/api/wishlist/${activeProductId}`);
    const listA = await userA.agent.get("/api/wishlist");

    expect(attempt.status).toBe(204);
    expect(listA.body.data).toHaveLength(1);
  });
});

describe("wishlist rules", () => {
  it("saves a product only once", async () => {
    const user = await registerUser("wishlist-twice");

    const first = await user.agent.post(`/api/wishlist/${activeProductId}`);
    const second = await user.agent.post(`/api/wishlist/${activeProductId}`);
    const list = await user.agent.get("/api/wishlist");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
  });

  it("refuses unknown, inactive and malformed product ids", async () => {
    const user = await registerUser("wishlist-refused");

    const unknown = await user.agent.post(`/api/wishlist/${randomUUID()}`);
    const hidden = await user.agent.post(`/api/wishlist/${hiddenProductId}`);
    const malformed = await user.agent.post("/api/wishlist/not-a-uuid");

    expect(unknown.status).toBe(404);
    expect(hidden.status).toBe(404);
    expect(malformed.status).toBe(400);
  });

  it("hides a product that was deactivated after it was saved", async () => {
    const user = await registerUser("wishlist-deactivated");
    const product = await prisma.product.create({ data: productData("Wish later") });

    await user.agent.post(`/api/wishlist/${product.id}`);
    await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
    const list = await user.agent.get("/api/wishlist");

    expect(list.body.data).toEqual([]);
  });
});
