import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CartItemRow } from "@/features/cart/CartItemRow";
import { useCart } from "@/features/cart/useCart";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CartButton() {
  const [open, setOpen] = useState(false);
  const { items, itemCount, subtotalCents } = useCart();

  const label =
    itemCount === 0 ? "Open cart" : `Open cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`;

  function close() {
    setOpen(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        <ShoppingCart className="size-5" />
        {itemCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Your cart</SheetTitle>
            <SheetDescription className="sr-only">The products in your cart</SheetDescription>
          </SheetHeader>

          {items.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <>
              <ul className="flex-1 divide-y overflow-y-auto px-4">
                {items.map((item) => (
                  <CartItemRow key={item.productId} item={item} onNavigate={close} />
                ))}
              </ul>
              <SheetFooter className="border-t">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-lg font-semibold">{formatPrice(subtotalCents)}</span>
                </div>
                <Link to="/cart" onClick={close} className={buttonVariants({ variant: "outline" })}>
                  View cart
                </Link>
                <Link to="/checkout" onClick={close} className={cn(buttonVariants({ size: "lg" }))}>
                  Checkout
                </Link>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
