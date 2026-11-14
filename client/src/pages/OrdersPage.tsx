import { Package } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/features/orders/hooks";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getErrorMessage } from "@/lib/api";
import { formatDate, formatOrderNumber, formatPrice } from "@/lib/format";

export function OrdersPage() {
  usePageTitle("Orders");

  const query = useOrders();
  let content: ReactNode;

  if (query.isPending) {
    content = (
      <div role="status" aria-label="Loading orders" className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  } else if (query.isError) {
    content = <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  } else if (query.data.length === 0) {
    content = (
      <EmptyState
        icon={<Package className="size-10 text-muted-foreground" />}
        title="No orders yet"
        description="When you place an order, it will appear here."
        action={
          <Link to="/shop" className={buttonVariants({ variant: "outline" })}>
            Browse the shop
          </Link>
        }
      />
    );
  } else {
    content = (
      <ul className="flex flex-col gap-4">
        {query.data.map((order) => {
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <li key={order.id}>
              <Link to={`/orders/${order.id}`} className="block">
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Order #{formatOrderNumber(order.id)}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)} - {itemCount}{" "}
                        {itemCount === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-lg font-semibold">{formatPrice(order.totalCents)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
      {content}
    </div>
  );
}
