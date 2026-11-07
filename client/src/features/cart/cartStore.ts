import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addItem, changeQuantity, removeItem, sanitizeCart } from "./cartLogic";
import type { CartItem, CartProduct } from "./types";

type CartState = {
  items: CartItem[];
  add: (product: CartProduct, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product, quantity = 1) =>
        set((state) => ({ items: addItem(state.items, product, quantity) })),
      setQuantity: (productId, quantity) =>
        set((state) => ({ items: changeQuantity(state.items, productId, quantity) })),
      remove: (productId) => set((state) => ({ items: removeItem(state.items, productId) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "gadgethub-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only the items are saved, not the functions.
      partialize: (state) => ({ items: state.items }),
      // Check what comes back from localStorage before using it.
      merge: (saved, current) => ({ ...current, items: sanitizeCart(saved) }),
    },
  ),
);
