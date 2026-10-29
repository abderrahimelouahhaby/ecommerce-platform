import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";

const suffix = randomUUID().slice(0, 8);
let categoryId = "";

function productData(
  name: string,
  overrides: { stock?: number; priceCents?: number; slug?: string },
) {
  return {
    name,
    slug: overrides.slug ?? `test-${name}-${suffix}`,
    description: "Product created by a test",
    priceCents: overrides.priceCents ?? 1000,
    stock: overrides.stock ?? 1,
    categoryId,
  };
}

beforeAll(async () => {
  const category = await prisma.category.create({
    data: { name: `Test category ${suffix}`, slug: `test-category-${suffix}` },
  });
  categoryId = category.id;
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { categoryId } });
  await prisma.category.delete({ where: { id: categoryId } });
  await prisma.$disconnect();
});

describe("database rules", () => {
  it("accepts a valid product", async () => {
    const created = await prisma.product.create({ data: productData("valid", {}) });

    expect(created.id).toBeTruthy();
    expect(created.isActive).toBe(true);
  });

  it("rejects a negative stock", async () => {
    await expect(
      prisma.product.create({ data: productData("negative-stock", { stock: -1 }) }),
    ).rejects.toThrow();
  });

  it("rejects a negative price", async () => {
    await expect(
      prisma.product.create({ data: productData("negative-price", { priceCents: -100 }) }),
    ).rejects.toThrow();
  });

  it("rejects two products with the same slug", async () => {
    const slug = `same-slug-${suffix}`;
    await prisma.product.create({ data: productData("first", { slug }) });

    await expect(
      prisma.product.create({ data: productData("second", { slug }) }),
    ).rejects.toThrow();
  });

  it("refuses to delete a category that still has products", async () => {
    await expect(prisma.category.delete({ where: { id: categoryId } })).rejects.toThrow();
  });
});
