import { describe, expect, it } from "vitest";
import { seedCategories } from "../prisma/seedData.js";

const products = seedCategories.flatMap((category) => category.products);

describe("seed data", () => {
  it("has 5 categories and 30 products", () => {
    expect(seedCategories).toHaveLength(5);
    expect(products).toHaveLength(30);
  });

  it("has unique slugs for categories and products", () => {
    const categorySlugs = seedCategories.map((category) => category.slug);
    const productSlugs = products.map((product) => product.slug);

    expect(new Set(categorySlugs).size).toBe(categorySlugs.length);
    expect(new Set(productSlugs).size).toBe(productSlugs.length);
  });

  it("uses clean URL slugs", () => {
    for (const product of products) {
      expect(product.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("stores prices as positive whole cents and stock as whole numbers", () => {
    for (const product of products) {
      expect(Number.isInteger(product.priceCents)).toBe(true);
      expect(product.priceCents).toBeGreaterThan(0);
      expect(Number.isInteger(product.stock)).toBe(true);
      expect(product.stock).toBeGreaterThanOrEqual(0);
    }
  });

  it("includes out of stock and low stock products for the interface", () => {
    expect(products.some((product) => product.stock === 0)).toBe(true);
    expect(products.some((product) => product.stock > 0 && product.stock <= 5)).toBe(true);
  });
});
