import { prisma } from "../../../lib/prisma.js";
import { LOW_STOCK_THRESHOLD } from "../inventory/adminInventory.service.js";

// A sale is an order that is confirmed: paid by card, or shipped, or delivered.
// A pending cash order is not a sale yet, and a cancelled order never is.
const SALE_STATUSES = ["PAID", "SHIPPED", "DELIVERED"] as const;

export async function getStats() {
  const [sales, pendingCount, usersCount, lowStockCount] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: [...SALE_STATUSES] } },
      _sum: { totalCents: true },
      _count: { _all: true },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } } }),
  ]);

  return {
    revenueCents: sales._sum.totalCents ?? 0,
    salesCount: sales._count._all,
    pendingCount,
    usersCount,
    lowStockCount,
  };
}

type SaleRow = { createdAt: Date; totalCents: number };

// One entry for each of the last `days` days (UTC), even when nothing was sold that day.
// A chart needs every day, otherwise the line would jump over the empty days.
export function groupSalesByDay(sales: SaleRow[], days: number, now = new Date()) {
  const buckets = new Map<string, { date: string; revenueCents: number; orders: number }>();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setUTCHours(0, 0, 0, 0);
    day.setUTCDate(day.getUTCDate() - offset);

    const date = day.toISOString().slice(0, 10);
    buckets.set(date, { date, revenueCents: 0, orders: 0 });
  }

  for (const sale of sales) {
    const bucket = buckets.get(sale.createdAt.toISOString().slice(0, 10));

    if (bucket) {
      bucket.revenueCents += sale.totalCents;
      bucket.orders += 1;
    }
  }

  return [...buckets.values()];
}

export async function getSalesPerDay(days: number) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const sales = await prisma.order.findMany({
    where: { status: { in: [...SALE_STATUSES] }, createdAt: { gte: start } },
    select: { createdAt: true, totalCents: true },
  });

  return groupSalesByDay(sales, days);
}
