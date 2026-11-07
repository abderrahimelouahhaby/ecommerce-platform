import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Product } from "@/features/products/types";
import { maxQuantityFor } from "./cartLogic";
import { toCartProduct } from "./toCartProduct";
import { useCart } from "./useCart";

export function AddToCartButton({ product }: { product: Product }) {
  const { items, add } = useCart();
  const navigate = useNavigate();

  const inCart = items.find((item) => item.productId === product.id)?.quantity ?? 0;
  const limit = maxQuantityFor(product.stock);

  if (limit === 0) {
    return (
      <Button size="lg" disabled>
        Out of stock
      </Button>
    );
  }

  const atLimit = inCart >= limit;

  function handleClick() {
    add(toCartProduct(product));
    toast.success(`${product.name} added to cart`, {
      action: { label: "View cart", onClick: () => navigate("/cart") },
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" disabled={atLimit} onClick={handleClick}>
        {atLimit ? "Maximum in cart" : "Add to cart"}
      </Button>
      {inCart > 0 && <p className="text-sm text-muted-foreground">{inCart} in your cart</p>}
    </div>
  );
}
