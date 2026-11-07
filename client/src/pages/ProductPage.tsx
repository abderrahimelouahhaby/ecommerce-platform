import { Link, useParams } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ProductImage } from "@/components/products/ProductImage";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AddToCartButton } from "@/features/cart/AddToCartButton";
import { useProduct } from "@/features/products/hooks";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getErrorMessage, isNotFound } from "@/lib/api";
import { formatPrice } from "@/lib/format";

function ProductPageSkeleton() {
  return (
    <div role="status" aria-label="Loading product" className="grid gap-8 md:grid-cols-2">
      <Skeleton className="aspect-square w-full" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

export function ProductPage() {
  const { slug = "" } = useParams();
  const query = useProduct(slug);

  usePageTitle(query.data?.name ?? "Product");

  if (query.isPending) {
    return <ProductPageSkeleton />;
  }

  if (query.isError) {
    if (isNotFound(query.error)) {
      return (
        <EmptyState
          title="Product not found"
          description="This product does not exist or is no longer available."
          action={
            <Link to="/shop" className={buttonVariants({ variant: "outline" })}>
              Back to the shop
            </Link>
          }
        />
      );
    }

    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  }

  const product = query.data;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/shop" className="hover:text-foreground">
          Shop
        </Link>{" "}
        <span aria-hidden="true">/</span>{" "}
        <Link to={`/shop?category=${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
      </nav>

      <article className="grid gap-8 md:grid-cols-2">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="aspect-square w-full rounded-lg border"
        />

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-3xl font-semibold">{formatPrice(product.priceCents)}</p>

          {product.stock === 0 ? (
            <Badge variant="destructive" className="self-start">
              Out of stock
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground">
              {product.stock <= 5 ? `Only ${product.stock} left in stock` : "In stock"}
            </p>
          )}

          <Separator />

          <p className="text-muted-foreground">{product.description}</p>

          <AddToCartButton product={product} />

          {/* The wishlist button is added in part 10. */}
        </div>
      </article>
    </div>
  );
}
