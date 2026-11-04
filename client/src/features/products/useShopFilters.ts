import { useSearchParams } from "react-router";
import { defaultFilters, readFilters, writeFilters, type ShopFilters } from "./filters";

// The shop filters live in the URL. This hook reads them and updates them.
export function useShopFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);

  // Any change goes back to page 1, unless the change is the page itself.
  function updateFilters(changes: Partial<ShopFilters>) {
    setSearchParams(writeFilters({ ...filters, page: 1, ...changes }));
  }

  // Removes the search, category and price. Keeps the sort choice.
  function clearFilters() {
    setSearchParams(writeFilters({ ...defaultFilters, sort: filters.sort }));
  }

  return { filters, updateFilters, clearFilters };
}
