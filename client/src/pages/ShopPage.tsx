import type { ReactNode } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Pagination } from "@/components/Pagination";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/ProductGrid";
import { ShopSidebar } from "@/components/products/ShopSidebar";
import { SortSelect } from "@/components/products/SortSelect";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { hasActiveFilters } from "@/features/products/filters";
import { useCategories, useProducts } from "@/features/products/hooks";
import { useShopFilters } from "@/features/products/useShopFilters";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ShopPage() {
  usePageTitle("Shop");

  const { filters, updateFilters, clearFilters } = useShopFilters();
  const categoriesQuery = useCategories();
  const productsQuery = useProducts(filters);

  function goToPage(page: number) {
    updateFilters({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  let content: ReactNode;

  if (productsQuery.isPending) {
    content = <ProductGridSkeleton className="lg:grid-cols-3" />;
  } else if (productsQuery.isError) {
    content = (
      <ErrorState
        message={getErrorMessage(productsQuery.error)}
        onRetry={() => productsQuery.refetch()}
      />
    );
  } else if (productsQuery.data.data.length === 0) {
    content = (
      <EmptyState
        title="No products found"
        description="Try a different search, or remove some filters."
        action={
          hasActiveFilters(filters) ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : undefined
        }
      />
    );
  } else {
    const { data: products, pagination } = productsQuery.data;

    content = (
      <>
        <div className={cn(productsQuery.isPlaceholderData && "opacity-60 transition-opacity")}>
          <ProductGrid products={products} className="lg:grid-cols-3" />
        </div>
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={goToPage}
        />
      </>
    );
  }

  const total = productsQuery.data?.pagination.total;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Shop</h1>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[16rem_1fr]">
        <aside aria-label="Filters">
          <ShopSidebar
            filters={filters}
            categoriesQuery={categoriesQuery}
            onChange={updateFilters}
            onClear={clearFilters}
          />
        </aside>

        <section aria-label="Products" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {total === undefined ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {total} {total === 1 ? "product" : "products"}
              </p>
            )}
            <SortSelect value={filters.sort} onChange={(sort) => updateFilters({ sort })} />
          </div>

          {content}
        </section>
      </div>
    </div>
  );
}
