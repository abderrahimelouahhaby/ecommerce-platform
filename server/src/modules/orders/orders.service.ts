import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/appError.js";
import { prisma } from "../../lib/prisma.js";
import { type CreateOrderInput, MAX_QUANTITY_PER_ITEM } from "./orders.schema.js";

// The fields of an order that are sent to the customer.
export const orderSelect = {
  id: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  totalCents: true,
  shippingName: true,
  shippingPhone: true,
  shippingAddress: true,
  shippingCity: true,
  shippingPostalCode: true,
  shippingCountry: true,
  createdAt: true,
  items: {
    select: { id: true, productId: true, productName: true, priceCents: true, quantity: true },
    orderBy: { productName: "asc" },
  },
} satisfies Prisma.OrderSelect;

type OrderLine = {
  productId: string;
  productName: string;
  priceCents: number;
  quantity: number;
};

type PaymentMethod = "COD" | "CARD";

// If the same product appears twice, add the quantities, and check the limit again.
function mergeQuantities(items: CreateOrderInput["items"]): Map<string, number> {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  for (const quantity of quantities.values()) {
    if (quantity > MAX_QUANTITY_PER_ITEM) {
      throw new AppError(400, `You can order at most ${MAX_QUANTITY_PER_ITEM} of the same product`);
    }
  }

  return quantities;
}

// Creates a pending order and reserves the stock, in one transaction.
// The payment method only changes how the customer pays later, the stock rules are the same.
export async function createOrder(
  userId: string,
  input: CreateOrderInput,
  paymentMethod: PaymentMethod = "COD",
) {
  const quantities = mergeQuantities(input.items);

  // Always handle the products in the same order. Two orders that share products then
  // wait for each other in a line, and never block each other in a circle (a deadlock).
  const productIds = [...quantities.keys()].sort();

  return prisma.$transaction(async (tx) => {
    // 1. The real name and price come from the database, never from the client.
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, name: true, priceCents: true },
    });

    if (products.length !== productIds.length) {
      throw new AppError(404, "One or more products are no longer available");
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const lines: OrderLine[] = [];
    let totalCents = 0;

    for (const productId of productIds) {
      const product = productById.get(productId);
      const quantity = quantities.get(productId);

      if (!product || quantity === undefined) {
        throw new AppError(404, "One or more products are no longer available");
      }

      // 2. One atomic step: decrease the stock only if there is enough of it.
      // If two orders arrive together, the database lets only one of them pass.
      const reserved = await tx.product.updateMany({
        where: { id: productId, isActive: true, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });

      if (reserved.count === 0) {
        throw new AppError(409, `Not enough stock for ${product.name}`);
      }

      totalCents += product.priceCents * quantity;
      lines.push({
        productId,
        productName: product.name,
        priceCents: product.priceCents,
        quantity,
      });
    }

    // 3. The order, with a snapshot of the name and price of every item.
    return tx.order.create({
      data: {
        userId,
        status: "PENDING",
        paymentMethod,
        paymentStatus: "UNPAID",
        totalCents,
        shippingName: input.shipping.name,
        shippingPhone: input.shipping.phone,
        shippingAddress: input.shipping.address,
        shippingCity: input.shipping.city,
        shippingPostalCode: input.shipping.postalCode,
        shippingCountry: input.shipping.country,
        items: { create: lines },
      },
      select: orderSelect,
    });
  });
}

export async function listOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 50,
    select: orderSelect,
  });
}

export async function getOrder(userId: string, orderId: string) {
  // The filter has the user id: an order of someone else is simply "not found".
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: orderSelect,
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  return order;
}

// Puts the stock of an order back. It must run inside the transaction that cancels the order.
async function restoreStock(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
  const items = await tx.orderItem.findMany({
    where: { orderId },
    select: { productId: true, quantity: true },
  });

  // Same product order as when the order was created.
  for (const item of items.sort((a, b) => a.productId.localeCompare(b.productId))) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
}

export async function cancelOrder(userId: string, orderId: string) {
  return prisma.$transaction(async (tx) => {
    // One atomic step: only one request can move the order from PENDING to CANCELLED.
    // A second click, or a second request at the same time, finds nothing to update.
    const claimed = await tx.order.updateMany({
      where: { id: orderId, userId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });

    if (claimed.count === 0) {
      const existing = await tx.order.findFirst({
        where: { id: orderId, userId },
        select: { id: true },
      });

      if (!existing) {
        throw new AppError(404, "Order not found");
      }

      throw new AppError(409, "Only a pending order can be cancelled");
    }

    await restoreStock(tx, orderId);

    return tx.order.findUniqueOrThrow({ where: { id: orderId }, select: orderSelect });
  });
}

// Used by the Stripe webhook when a payment session expires. No user is involved.
// Returns false when there was nothing to cancel (already paid, cancelled or handled).
export async function cancelUnpaidOrder(orderId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING", paymentStatus: "UNPAID" },
      data: { status: "CANCELLED", paymentStatus: "FAILED" },
    });

    if (claimed.count === 0) {
      return false;
    }

    await restoreStock(tx, orderId);

    return true;
  });
}
