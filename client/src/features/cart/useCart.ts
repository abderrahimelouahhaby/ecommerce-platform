import { useMemo } from "react";
import { calculateTotals } from "./cartLogic";
import { useCartStore } from "./cartStore";

// The cart for components: the items, the totals and the actions.
export function useCart() {
  const items = useCartStore((state) => state.items);
  const add = useCartStore((state) => state.add);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);

  const totals = useMemo(() => calculateTotals(items), [items]);

  return { items, ...totals, add, setQuantity, remove, clear };
}
