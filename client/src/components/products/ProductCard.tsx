import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/features/products/types";
import { WishlistButton } from "@/features/wishlist/WishlistButton";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { StockBadge } from "./StockBadge";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="relative h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <Link to={`/products/${product.slug}`} className="flex h-full flex-col">
        <ProductImage src={product.imageUrl} alt={product.name} className="aspect-square w-full" />
        <CardContent className="flex flex-1 flex-col gap-1 p-4">
          <span className="text-xs text-muted-foreground">{product.category.name}</span>
          <h3 className="font-medium leading-snug">{product.name}</h3>
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <span className="text-lg font-semibold">{formatPrice(product.priceCents)}</span>
            <StockBadge stock={product.stock} />
          </div>
        </CardContent>
      </Link>

      <WishlistButton
        product={product}
        className="absolute top-2 right-2 bg-background/80 hover:bg-background"
      />
    </Card>
  );
}
