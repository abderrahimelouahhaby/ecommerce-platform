import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/features/products/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

const gridClass = "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4";

export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div className={cn(gridClass, className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Grey placeholders with the same shape as the cards, shown while products load.
export function ProductGridSkeleton({
  count = 12,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-label="Loading products" className={cn(gridClass, className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      ))}
    </div>
  );
}
