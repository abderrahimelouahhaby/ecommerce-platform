import type { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../../lib/appError.js";
import { pageInfo } from "../../../lib/pagination.js";
import { prisma } from "../../../lib/prisma.js";
import { orderSelect } from "../../orders/orders.service.js";

type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

// The order as the customer sees it, plus who bought it.
export const adminOrderSelect = {
  ...orderSelect,
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OrderSelect;

type OrderListQuery = { page: number; limit: number; status?: OrderStatus | undefined };

export async function listAdminOrders({ page, limit, status }: OrderListQuery) {
  const where: Prisma.OrderWhereInput = status ? { status } : {};

  const [total, items] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: adminOrderSelect,
    }),
  ]);

  return { items, pagination: pageInfo(page, limit, total) };
}

// An admin can only move an order forward:
//   PAID (card) or PENDING (cash on delivery)  ->  SHIPPED  ->  DELIVERED
// A cash order is paid when it is delivered. Cancelling is done by the customer, or by Stripe.
export async function changeOrderStatus(orderId: string, nextStatus: "SHIPPED" | "DELIVERED") {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true, paymentMethod: true },
    });

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    const allowed =
      nextStatus === "SHIPPED"
        ? order.status === "PAID" || (order.status === "PENDING" && order.paymentMethod === "COD")
        : order.status === "SHIPPED";

    if (!allowed) {
      throw new AppError(
        409,
        `An order that is ${order.status.toLowerCase()} cannot be marked as ${nextStatus.toLowerCase()}`,
      );
    }

    // The current status is part of the filter: if two admins act at the same time,
    // only one change is applied.
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data:
        nextStatus === "DELIVERED" && order.paymentMethod === "COD"
          ? { status: nextStatus, paymentStatus: "PAID" }
          : { status: nextStatus },
    });

    if (updated.count === 0) {
      throw new AppError(409, "The order was changed by someone else, please reload");
    }

    return tx.order.findUniqueOrThrow({ where: { id: orderId }, select: adminOrderSelect });
  });
}
