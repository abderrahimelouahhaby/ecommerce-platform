import type { Product } from "@/features/products/types";

export type WishlistEntry = {
  addedAt: string;
  product: Product;
};
