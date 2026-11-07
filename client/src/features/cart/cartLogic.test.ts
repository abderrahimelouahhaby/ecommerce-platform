import { describe, expect, it } from "vitest";
import {
  addItem,
  calculateTotals,
  changeQuantity,
  MAX_QUANTITY_PER_ITEM,
  sanitizeCart,
} from "./cartLogic";
import type { CartItem, CartProduct } from "./types";

function makeProduct(overrides: Partial<CartProduct> = {}): CartProduct {
  return {
    productId: "p1",
    slug: "test-product",
    name: "Test product",
    priceCents: 1999,
    imageUrl: null,
    stock: 5,
    ...overrides,
  };
}

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return { ...makeProduct(), quantity: 1, ...overrides };
}

describe("addItem", () => {
  it("merges the same product into one line", () => {
    let items = addItem([], makeProduct());
    items = addItem(items, makeProduct());

    expect(items).toHaveLength(1);
    expect(items[0]?.quantity).toBe(2);
  });

  it("never goes above the stock", () => {
    let items = addItem([], makeProduct({ stock: 3 }), 10);
    items = addItem(items, makeProduct({ stock: 3 }));

    expect(items[0]?.quantity).toBe(3);
  });

  it("never goes above the maximum per product", () => {
    const items = addItem([], makeProduct({ stock: 100 }), 50);

    expect(items[0]?.quantity).toBe(MAX_QUANTITY_PER_ITEM);
  });

  it("refuses a product that is out of stock", () => {
    expect(addItem([], makeProduct({ stock: 0 }))).toEqual([]);
  });

  it("refreshes the saved price when the product is added again", () => {
    const items = addItem([makeItem()], makeProduct({ priceCents: 2499 }));

    expect(items[0]?.priceCents).toBe(2499);
    expect(items[0]?.quantity).toBe(2);
  });
});

describe("changeQuantity", () => {
  it("keeps the quantity within the stock", () => {
    const items = [makeItem({ stock: 4 })];

    expect(changeQuantity(items, "p1", 3)[0]?.quantity).toBe(3);
    expect(changeQuantity(items, "p1", 99)[0]?.quantity).toBe(4);
  });

  it("removes the line when the quantity is below 1", () => {
    expect(changeQuantity([makeItem()], "p1", 0)).toEqual([]);
  });

  it("ignores a quantity that is not a whole number", () => {
    const items = [makeItem({ quantity: 2 })];

    expect(changeQuantity(items, "p1", 1.5)).toEqual(items);
  });
});

describe("calculateTotals", () => {
  it("sums the quantities and the prices in exact cents", () => {
    const items = [
      makeItem({ productId: "a", priceCents: 1999, quantity: 3 }),
      makeItem({ productId: "b", priceCents: 29, quantity: 7 }),
    ];

    expect(calculateTotals(items)).toEqual({ itemCount: 10, subtotalCents: 6200 });
  });
});

describe("sanitizeCart", () => {
  it("lowers a tampered quantity to the stock", () => {
    const saved = { items: [makeItem({ stock: 4, quantity: 9999 })] };

    expect(sanitizeCart(saved)[0]?.quantity).toBe(4);
  });

  it.each([
    { name: "nothing saved", saved: undefined },
    { name: "text instead of an object", saved: "hello" },
    { name: "items that are not a list", saved: { items: "no" } },
    { name: "a negative price", saved: { items: [makeItem({ priceCents: -1 })] } },
    {
      name: "an image address that is not http",
      saved: { items: [makeItem({ imageUrl: "javascript:alert(1)" })] },
    },
  ])("gives an empty cart for $name", ({ saved }) => {
    expect(sanitizeCart(saved)).toEqual([]);
  });
});
