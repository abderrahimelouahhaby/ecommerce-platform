import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isNotFound } from "@/lib/api";
import { fetchCategories, fetchProduct, fetchProducts } from "./api";
import { PAGE_SIZE, type ShopFilters } from "./filters";

export function useProducts(filters: ShopFilters, limit = PAGE_SIZE) {
  return useQuery({
    queryKey: ["products", filters, limit],
    queryFn: () => fetchProducts(filters, limit),
    // While the next page loads, keep showing the previous one.
    placeholderData: keepPreviousData,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct(slug),
    // A product that does not exist will not appear if we ask again.
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 1,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  });
}
