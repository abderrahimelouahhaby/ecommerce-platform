import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/features/orders/types";

const statuses: Record<
  OrderStatus,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  PAID: { label: "Paid", variant: "default" },
  SHIPPED: { label: "Shipped", variant: "default" },
  DELIVERED: { label: "Delivered", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = statuses[status];

  return <Badge variant={variant}>{label}</Badge>;
}
