import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/appError.js";
import { prisma } from "../../lib/prisma.js";
import type { ProductListQuery, ProductSort } from "./products.schema.js";

const publicProductSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  priceCents: true,
  stock: true,
  imageUrl: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductSelect;

// The second item (id) keeps the order stable when two products have the same price or date.
// Without it, a product could appear on two pages or on none.
const orderByMap = {
  newest: [{ createdAt: "desc" }, { id: "asc" }],
  price_asc: [{ priceCents: "asc" }, { id: "asc" }],
  price_desc: [{ priceCents: "desc" }, { id: "asc" }],
  name_asc: [{ name: "asc" }, { id: "asc" }],
} satisfies Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]>;

export async function listProducts(query: ProductListQuery) {
  const { search, category, minPrice, maxPrice, sort, page, limit } = query;

  // Visitors only ever see active products.
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.priceCents = { gte: minPrice, lte: maxPrice };
  }

  // Count and fetch in one transaction, so the total matches the page.
  const [total, items] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: orderByMap[sort],
      skip: (page - 1) * limit,
      take: limit,
      select: publicProductSelect,
    }),
  ]);

  return { items, total };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: publicProductSelect,
  });

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  return product;
}
