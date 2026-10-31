import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const suffix = randomUUID().slice(0, 8);
const categorySlug = `test-products-${suffix}`;
const cheapSlug = `alpha-${suffix}`;
const expensiveSlug = `beta-${suffix}`;
const hiddenSlug = `hidden-${suffix}`;

beforeAll(async () => {
  const category = await prisma.category.create({
    data: { name: `Test products ${suffix}`, slug: categorySlug },
  });

  const base = {
    description: "Created by a test",
    stock: 5,
    categoryId: category.id,
    imagePublicId: "internal/image-id",
  };

  await prisma.product.createMany({
    data: [
      { ...base, name: `Alpha ${suffix}`, slug: cheapSlug, priceCents: 10000 },
      { ...base, name: `Beta ${suffix}`, slug: expensiveSlug, priceCents: 50000 },
      { ...base, name: `Hidden ${suffix}`, slug: hiddenSlug, priceCents: 20000, isActive: false },
    ],
  });
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { category: { slug: categorySlug } } });
  await prisma.category.deleteMany({ where: { slug: categorySlug } });
  await prisma.$disconnect();
});

describe("product visibility", () => {
  it("hides inactive products and internal fields in the list", async () => {
    const res = await request(app)
      .get("/api/products")
      .query({ category: categorySlug, sort: "price_asc" });

    const slugs = res.body.data.map((product: { slug: string }) => product.slug);

    expect(res.status).toBe(200);
    expect(slugs).toEqual([cheapSlug, expensiveSlug]);

    for (const product of res.body.data) {
      expect(product).not.toHaveProperty("imagePublicId");
      expect(product).not.toHaveProperty("isActive");
    }
  });

  it("returns an active product by slug, and 404 for an inactive or unknown one", async () => {
    const active = await request(app).get(`/api/products/${cheapSlug}`);
    const hidden = await request(app).get(`/api/products/${hiddenSlug}`);
    const unknown = await request(app).get("/api/products/does-not-exist");

    expect(active.status).toBe(200);
    expect(active.body.data.category.slug).toBe(categorySlug);
    expect(hidden.status).toBe(404);
    expect(unknown.status).toBe(404);
  });

  it("counts only active products in the categories list", async () => {
    const res = await request(app).get("/api/categories");

    const category = res.body.data.find((item: { slug: string }) => item.slug === categorySlug);

    expect(res.status).toBe(200);
    expect(category?.productCount).toBe(2);
  });
});

describe("product filters", () => {
  it("filters by price range in cents and never returns inactive products", async () => {
    const res = await request(app)
      .get("/api/products")
      .query({ category: categorySlug, minPrice: 20000, maxPrice: 60000 });

    const slugs = res.body.data.map((product: { slug: string }) => product.slug);

    expect(res.status).toBe(200);
    expect(slugs).toEqual([expensiveSlug]);
  });

  it("paginates and reports the totals", async () => {
    const res = await request(app)
      .get("/api/products")
      .query({ category: categorySlug, sort: "price_asc", limit: 1, page: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe(expensiveSlug);
    expect(res.body.pagination).toEqual({ page: 2, limit: 1, total: 2, totalPages: 2 });
  });
});

describe("query validation", () => {
  it.each([
    { name: "a limit above the maximum", query: { limit: 1000 } },
    { name: "a page below 1", query: { page: 0 } },
    { name: "an unknown sort value", query: { sort: "price; DROP TABLE products" } },
    { name: "a minimum price above the maximum", query: { minPrice: 500, maxPrice: 100 } },
  ])("rejects $name", async ({ query }) => {
    const res = await request(app).get("/api/products").query(query);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Validation failed");
  });

  it("rejects a parameter that is sent twice", async () => {
    const res = await request(app).get("/api/products?limit=5&limit=6");

    expect(res.status).toBe(400);
  });

  it("treats a SQL injection attempt as plain search text", async () => {
    const res = await request(app)
      .get("/api/products")
      .query({ search: "'; DROP TABLE products; --" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(await prisma.product.count()).toBeGreaterThan(0);
  });
});
