import type { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../../lib/appError.js";
import { pageInfo } from "../../../lib/pagination.js";
import { prisma } from "../../../lib/prisma.js";

// A product with this stock or less is "low".
export const LOW_STOCK_THRESHOLD = 5;

const inventorySelect = {
  id: true,
  name: true,
  slug: true,
  stock: true,
  isActive: true,
  imageUrl: true,
  category: { select: { id: true, name: true } },
} satisfies Prisma.ProductSelect;

type InventoryListQuery = { page: number; limit: number; status: "all" | "low" | "out" };

export async function listInventory({ page, limit, status }: InventoryListQuery) {
  const where: Prisma.ProductWhereInput = {};

  if (status === "low") where.stock = { lte: LOW_STOCK_THRESHOLD };
  if (status === "out") where.stock = 0;

  const [total, items] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      // The products that need attention come first.
      orderBy: [{ stock: "asc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: inventorySelect,
    }),
  ]);

  return { items, pagination: pageInfo(page, limit, total) };
}

export async function setStock(productId: string, stock: number) {
  const updated = await prisma.product.updateMany({ where: { id: productId }, data: { stock } });

  if (updated.count === 0) {
    throw new AppError(404, "Product not found");
  }

  return prisma.product.findUniqueOrThrow({ where: { id: productId }, select: inventorySelect });
}
