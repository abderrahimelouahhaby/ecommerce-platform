import { api } from "@/lib/api";
import { dollarsToCents } from "@/lib/money";
import type { ShopFilters } from "./filters";
import type { Category, Product, ProductListResponse } from "./types";

export async function fetchProducts(
  filters: ShopFilters,
  limit: number,
): Promise<ProductListResponse> {
  const { data } = await api.get<ProductListResponse>("/products", {
    params: {
      search: filters.search || undefined,
      category: filters.category || undefined,
      // The API wants cents, the filters hold dollars.
      minPrice: dollarsToCents(filters.minPrice),
      maxPrice: dollarsToCents(filters.maxPrice),
      sort: filters.sort,
      page: filters.page,
      limit,
    },
  });

  return data;
}

export async function fetchProduct(slug: string): Promise<Product> {
  const { data } = await api.get<{ data: Product }>(`/products/${encodeURIComponent(slug)}`);

  return data.data;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<{ data: Category[] }>("/categories");

  return data.data;
}
