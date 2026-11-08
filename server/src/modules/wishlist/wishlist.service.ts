import { AppError } from "../../lib/appError.js";
import { prisma } from "../../lib/prisma.js";
import { publicProductSelect } from "../products/products.service.js";

// Every function receives the user id from the session, and every query is limited to it.

export async function listWishlist(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    // Products that were deactivated after being saved are hidden.
    where: { userId, product: { isActive: true } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: { createdAt: true, product: { select: publicProductSelect } },
  });

  return items.map((item) => ({ addedAt: item.createdAt, product: item.product }));
}

export async function addToWishlist(userId: string, productId: string): Promise<void> {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    select: { id: true },
  });

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  // Safe to repeat: the pair (userId, productId) is unique, so a second call changes nothing.
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  // The userId in the filter means nobody can remove the items of someone else.
  await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
}
