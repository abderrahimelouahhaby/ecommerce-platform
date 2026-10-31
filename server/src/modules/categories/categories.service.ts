import { prisma } from "../../lib/prisma.js";

export async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      // Only active products are counted, like in the shop.
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });

  return categories.map(({ _count, ...category }) => ({
    ...category,
    productCount: _count.products,
  }));
}
