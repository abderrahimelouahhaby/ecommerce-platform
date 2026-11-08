import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/useAuth";
import type { Product } from "@/features/products/types";
import { getErrorMessage } from "@/lib/api";
import { addToWishlist, fetchWishlist, removeFromWishlist } from "./api";
import type { WishlistEntry } from "./types";

// The key contains the user id, so the cached wishlist of one user is never shown to another.
function useWishlistKey() {
  const { user } = useAuth();

  return ["wishlist", user?.id] as const;
}

export function useWishlist() {
  const { isAuthenticated } = useAuth();
  const queryKey = useWishlistKey();

  return useQuery({
    queryKey,
    queryFn: fetchWishlist,
    // Visitors have no wishlist, so we do not ask the server.
    enabled: isAuthenticated,
  });
}

// The ids of the saved products, to know quickly if a heart must be filled.
export function useWishlistIds() {
  const { data } = useWishlist();

  return useMemo(() => new Set((data ?? []).map((entry) => entry.product.id)), [data]);
}

type ToggleVariables = {
  product: Product;
  isSaved: boolean;
};

// Adds the product if it is not saved, removes it if it is. The screen changes at once.
export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const queryKey = useWishlistKey();

  return useMutation({
    mutationFn: ({ product, isSaved }: ToggleVariables) =>
      isSaved ? removeFromWishlist(product.id) : addToWishlist(product.id),

    // 1. Before the request: change the cached list as if the server had said yes.
    onMutate: async ({ product, isSaved }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<WishlistEntry[]>(queryKey);

      queryClient.setQueryData<WishlistEntry[]>(queryKey, (current = []) =>
        isSaved
          ? current.filter((entry) => entry.product.id !== product.id)
          : [{ addedAt: new Date().toISOString(), product }, ...current],
      );

      return { previous };
    },

    // 2. If the request failed: put the old list back and tell the user.
    onError: (error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      toast.error(getErrorMessage(error));
    },

    // 3. In every case: ask the server for the real list, to be sure we are in sync.
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
