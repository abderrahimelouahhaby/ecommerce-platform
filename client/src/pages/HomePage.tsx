import { Link } from "react-router";
import { ErrorState } from "@/components/ErrorState";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/ProductGrid";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { defaultFilters } from "@/features/products/filters";
import { useCategories, useProducts } from "@/features/products/hooks";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getErrorMessage } from "@/lib/api";
import { APP_NAME } from "@/lib/constants";

export function HomePage() {
  usePageTitle();

  const categoriesQuery = useCategories();
  const newArrivalsQuery = useProducts(defaultFilters, 8);

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-start gap-6 py-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Gadgets you will love, at {APP_NAME}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Smartphones, laptops, audio and smart home devices. Browse the catalog, save your
          favorites and check out in a few clicks.
        </p>
        <Link to="/shop" className={buttonVariants({ size: "lg" })}>
          Browse the shop
        </Link>
      </section>

      <section aria-labelledby="categories-heading" className="flex flex-col gap-4">
        <h2 id="categories-heading" className="text-2xl font-semibold tracking-tight">
          Shop by category
        </h2>

        {categoriesQuery.isPending ? (
          <div
            role="status"
            aria-label="Loading categories"
            className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
          >
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        ) : categoriesQuery.isError ? (
          <ErrorState
            message={getErrorMessage(categoriesQuery.error)}
            onRetry={() => categoriesQuery.refetch()}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {categoriesQuery.data.map((category) => (
              <Link
                key={category.id}
                to={`/shop?category=${category.slug}`}
                className="rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <p className="font-medium">{category.name}</p>
                <p className="text-sm text-muted-foreground">
                  {category.productCount} {category.productCount === 1 ? "product" : "products"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="new-arrivals-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="new-arrivals-heading" className="text-2xl font-semibold tracking-tight">
            New arrivals
          </h2>
          <Link to="/shop" className="text-sm font-medium underline underline-offset-4">
            View all
          </Link>
        </div>

        {newArrivalsQuery.isPending ? (
          <ProductGridSkeleton count={8} />
        ) : newArrivalsQuery.isError ? (
          <ErrorState
            message={getErrorMessage(newArrivalsQuery.error)}
            onRetry={() => newArrivalsQuery.refetch()}
          />
        ) : (
          <ProductGrid products={newArrivalsQuery.data.data} />
        )}
      </section>
    </div>
  );
}
