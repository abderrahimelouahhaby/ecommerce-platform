import { ShoppingCart } from "lucide-react";
import { Link } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CartItemRow } from "@/features/cart/CartItemRow";
import { useCart } from "@/features/cart/useCart";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatPrice } from "@/lib/format";

export function CartPage() {
  usePageTitle("Cart");

  const { items, itemCount, subtotalCents, clear } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="size-10 text-muted-foreground" />}
        title="Your cart is empty"
        description="Browse the shop and add something you like."
        action={
          <Link to="/shop" className={buttonVariants()}>
            Browse the shop
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Cart</h1>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y rounded-lg border px-4">
          {items.map((item) => (
            <CartItemRow key={item.productId} item={item} />
          ))}
        </ul>

        <section aria-label="Order summary">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
                <span className="text-lg font-semibold">{formatPrice(subtotalCents)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Prices and stock are confirmed again when you place your order.
              </p>
              <Link to="/checkout" className={buttonVariants({ size: "lg" })}>
                Checkout
              </Link>
              <Button variant="ghost" onClick={clear}>
                Clear cart
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
