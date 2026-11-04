import { DOLLAR_AMOUNT } from "@/lib/money";

export const PAGE_SIZE = 12;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A to Z" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// The state of the shop page. Prices are dollars as typed by the user ("19.99").
export type ShopFilters = {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  sort: SortValue;
  page: number;
};

export const defaultFilters: ShopFilters = {
  search: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  sort: "newest",
  page: 1,
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSort(value: string | null): value is SortValue {
  return SORT_OPTIONS.some((option) => option.value === value);
}

// Reads the filters from the URL. Anything invalid falls back to the default,
// so a strange address never sends a bad request to the API.
export function readFilters(params: URLSearchParams): ShopFilters {
  const sort = params.get("sort");
  const category = params.get("category") ?? "";
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";
  const page = Number(params.get("page"));

  return {
    search: (params.get("search") ?? "").trim().slice(0, 100),
    category: SLUG.test(category) ? category : "",
    minPrice: DOLLAR_AMOUNT.test(minPrice) ? minPrice : "",
    maxPrice: DOLLAR_AMOUNT.test(maxPrice) ? maxPrice : "",
    sort: isSort(sort) ? sort : defaultFilters.sort,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

// Writes the filters to a URL query string. Default values are left out to keep the URL short.
export function writeFilters(filters: ShopFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.sort !== defaultFilters.sort) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}

export function hasActiveFilters(filters: ShopFilters): boolean {
  return Boolean(filters.search || filters.category || filters.minPrice || filters.maxPrice);
}
