import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCancelOrder, useOrder } from "@/features/orders/hooks";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getErrorMessage, isNotFound } from "@/lib/api";
import { formatDate, formatOrderNumber, formatPrice } from "@/lib/format";

function OrderPageSkeleton() {
  return (
    <div role="status" aria-label="Loading order" className="flex flex-col gap-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export function OrderPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const query = useOrder(id);
  const cancel = useCancelOrder();
  const [confirmOpen, setConfirmOpen] = useState(false);

  usePageTitle(query.data ? `Order ${formatOrderNumber(query.data.id)}` : "Order");

  if (query.isPending) {
    return <OrderPageSkeleton />;
  }

  if (query.isError) {
    if (isNotFound(query.error)) {
      return (
        <EmptyState
          title="Order not found"
          description="We could not find this order."
          action={
            <Link to="/orders" className={buttonVariants({ variant: "outline" })}>
              Back to your orders
            </Link>
          }
        />
      );
    }

    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  }

  const order = query.data;

  function handleCancel() {
    cancel.mutate(order.id, {
      onSuccess: () => {
        toast.success("Order cancelled");
        setConfirmOpen(false);
      },
      onError: (error) => {
        toast.error(getErrorMessage(error));
        setConfirmOpen(false);
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {searchParams.get("placed") === "1" && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>Thank you, your order is placed</AlertTitle>
          <AlertDescription>
            {order.paymentMethod === "COD"
              ? "You will pay in cash when your order arrives."
              : "We will confirm your payment shortly."}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Order #{formatOrderNumber(order.id)}
          </h1>
          <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {formatPrice(item.priceCents)}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatPrice(item.priceCents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-semibold">{formatPrice(order.totalCents)}</span>
              </div>
              <p>
                {order.paymentMethod === "COD"
                  ? "Cash on delivery"
                  : order.paymentStatus === "PAID"
                    ? "Paid by card"
                    : "Card payment not completed"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{order.shippingName}</p>
              <p>{order.shippingAddress}</p>
              <p>
                {order.shippingPostalCode} {order.shippingCity}
              </p>
              <p>{order.shippingCountry}</p>
              <p className="mt-2 text-muted-foreground">{order.shippingPhone}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {order.status === "PENDING" && (
        <div>
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            Cancel order
          </Button>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>The items go back on sale. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Keep order
            </Button>
            <Button variant="destructive" disabled={cancel.isPending} onClick={handleCancel}>
              Yes, cancel order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
