import { Badge } from "@/components/ui/badge";

// Only shows something when the stock needs attention.
export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge variant="destructive">Out of stock</Badge>;
  }

  if (stock <= 5) {
    return <Badge variant="secondary">Only {stock} left</Badge>;
  }

  return null;
}
