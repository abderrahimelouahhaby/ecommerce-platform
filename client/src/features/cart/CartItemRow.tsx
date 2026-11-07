import { Trash2 } from "lucide-react";
import { Link } from "react-router";
import { ProductImage } from "@/components/products/ProductImage";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { maxQuantityFor } from "./cartLogic";
import { QuantityStepper } from "./QuantityStepper";
import type { CartItem } from "./types";
import { useCart } from "./useCart";

type CartItemRowProps = {
  item: CartItem;
  // Called when the user follows the product link (the drawer uses it to close itself).
  onNavigate?: () => void;
};

export function CartItemRow({ item, onNavigate }: CartItemRowProps) {
  const { setQuantity, remove } = useCart();

  return (
    <li className="flex gap-4 py-4">
      <ProductImage src={item.imageUrl} alt="" className="size-20 shrink-0 rounded-md border" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex justify-between gap-2">
          <Link
            to={`/products/${item.slug}`}
            onClick={onNavigate}
            className="font-medium leading-snug hover:underline"
          >
            {item.name}
          </Link>
          <span className="font-semibold">{formatPrice(item.priceCents * item.quantity)}</span>
        </div>
        <p className="text-sm text-muted-foreground">{formatPrice(item.priceCents)} each</p>
        <div className="flex items-center justify-between">
          <QuantityStepper
            name={item.name}
            quantity={item.quantity}
            max={maxQuantityFor(item.stock)}
            onChange={(quantity) => setQuantity(item.productId, quantity)}
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove ${item.name} from cart`}
            onClick={() => remove(item.productId)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}
