import { z } from "zod";
import type { CartItem, CartProduct } from "./types";

export const MAX_QUANTITY_PER_ITEM = 10;
export const MAX_CART_LINES = 50;

// The most of one product that can be in the cart: the stock, but never above the limit.
export function maxQuantityFor(stock: number): number {
  return Math.max(0, Math.min(stock, MAX_QUANTITY_PER_ITEM));
}

export function addItem(items: CartItem[], product: CartProduct, quantity = 1): CartItem[] {
  const limit = maxQuantityFor(product.stock);

  if (limit === 0 || !Number.isInteger(quantity) || quantity < 1) {
    return items;
  }

  const existing = items.find((item) => item.productId === product.productId);

  if (existing) {
    // Same product again: one line, a bigger quantity, and a fresh snapshot of the product.
    return items.map((item) =>
      item.productId === product.productId
        ? { ...product, quantity: Math.min(item.quantity + quantity, limit) }
        : item,
    );
  }

  if (items.length >= MAX_CART_LINES) {
    return items;
  }

  return [...items, { ...product, quantity: Math.min(quantity, limit) }];
}

export function removeItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter((item) => item.productId !== productId);
}

export function changeQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  if (!Number.isInteger(quantity)) {
    return items;
  }

  if (quantity < 1) {
    return removeItem(items, productId);
  }

  return items
    .map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.min(quantity, maxQuantityFor(item.stock)) }
        : item,
    )
    .filter((item) => item.quantity >= 1);
}

// Prices are whole cents, so the sums are exact.
export function calculateTotals(items: CartItem[]): { itemCount: number; subtotalCents: number } {
  return items.reduce(
    (totals, item) => ({
      itemCount: totals.itemCount + item.quantity,
      subtotalCents: totals.subtotalCents + item.priceCents * item.quantity,
    }),
    { itemCount: 0, subtotalCents: 0 },
  );
}

// What localStorage may contain. Anyone can edit it, so we check every field.
const savedCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(100),
        slug: z.string().min(1).max(150),
        name: z.string().min(1).max(200),
        priceCents: z.number().int().min(0).max(100_000_000),
        imageUrl: z
          .string()
          .max(500)
          .regex(/^https?:\/\//)
          .nullable(),
        stock: z.number().int().min(0).max(100_000),
        quantity: z.number().int().min(1),
      }),
    )
    .max(MAX_CART_LINES),
});

// Turns saved data into a safe cart. Corrupted data gives an empty cart.
// A quantity that is too high is lowered to the allowed maximum.
export function sanitizeCart(saved: unknown): CartItem[] {
  const result = savedCartSchema.safeParse(saved);

  if (!result.success) {
    return [];
  }

  const uniqueItems = new Map(result.data.items.map((item) => [item.productId, item]));

  return [...uniqueItems.values()]
    .map((item) => ({ ...item, quantity: Math.min(item.quantity, maxQuantityFor(item.stock)) }))
    .filter((item) => item.quantity >= 1);
}
