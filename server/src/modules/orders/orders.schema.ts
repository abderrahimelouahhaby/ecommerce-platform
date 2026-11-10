import { z } from "zod";

// These limits match the cart in the client.
export const MAX_QUANTITY_PER_ITEM = 10;
export const MAX_ORDER_LINES = 50;

const shippingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(30)
    .regex(/^[0-9+()\s-]+$/),
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().min(2).max(100),
});

// The client sends WHAT to buy (ids and quantities) and WHERE to send it.
// Prices, names and stock are never accepted from the client: extra fields are removed by Zod.
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
      }),
    )
    .min(1)
    .max(MAX_ORDER_LINES),
  shipping: shippingSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// URL parameter of GET /api/orders/:id and POST /api/orders/:id/cancel.
export const orderParamsSchema = z.object({
  id: z.uuid(),
});
