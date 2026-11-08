import { Heart } from "lucide-react";
import { Link } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/ProductGrid";
import { buttonVariants } from "@/components/ui/button";
import { useWishlist } from "@/features/wishlist/hooks";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getErrorMessage } from "@/lib/api";

export function WishlistPage() {
  usePageTitle("Wishlist");

  const query = useWishlist();

  let content;

  if (query.isPending) {
    content = <ProductGridSkeleton count={4} />;
  } else if (query.isError) {
    content = <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  } else if (query.data.length === 0) {
    content = (
      <EmptyState
        icon={<Heart className="size-10 text-muted-foreground" />}
        title="Your wishlist is empty"
        description="Tap the heart on a product to save it here."
        action={
          <Link to="/shop" className={buttonVariants({ variant: "outline" })}>
            Browse the shop
          </Link>
        }
      />
    );
  } else {
    content = <ProductGrid products={query.data.map((entry) => entry.product)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Wishlist</h1>
      {content}
    </div>
  );
}
