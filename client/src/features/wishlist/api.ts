import { api } from "@/lib/api";
import type { WishlistEntry } from "./types";

export async function fetchWishlist(): Promise<WishlistEntry[]> {
  const { data } = await api.get<{ data: WishlistEntry[] }>("/wishlist");

  return data.data;
}

export async function addToWishlist(productId: string): Promise<void> {
  await api.post(`/wishlist/${encodeURIComponent(productId)}`);
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await api.delete(`/wishlist/${encodeURIComponent(productId)}`);
}
