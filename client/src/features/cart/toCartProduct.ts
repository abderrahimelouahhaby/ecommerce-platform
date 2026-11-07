import type { Product } from "@/features/products/types";
import type { CartProduct } from "./types";

// Keeps only what the cart needs from a product sent by the API.
export function toCartProduct(product: Product): CartProduct {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    priceCents: product.priceCents,
    imageUrl: product.imageUrl,
    stock: product.stock,
  };
}
