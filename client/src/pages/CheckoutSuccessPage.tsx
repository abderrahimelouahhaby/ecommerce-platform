import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PageSpinner } from "@/components/PageSpinner";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/features/cart/useCart";
import { useOrder } from "@/features/orders/hooks";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getErrorMessage, isNotFound } from "@/lib/api";
import { formatOrderNumber } from "@/lib/format";

function Message({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      {icon}
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

export function CheckoutSuccessPage() {
  usePageTitle("Payment");

  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order") ?? "";
  const { clear } = useCart();
  const query = useOrder(orderId, { waitForPayment: true });
  const status = query.data?.status;

  // The cart is cleared only when the payment is really confirmed by the server.
  useEffect(() => {
    if (status === "PAID") {
      clear();
    }
  }, [status, clear]);

  if (orderId === "") {
    return <Navigate to="/orders" replace />;
  }

  if (query.isPending) {
    return <PageSpinner />;
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
  const orderLink = (
    <Link to={`/orders/${order.id}`} className={buttonVariants()}>
      View order #{formatOrderNumber(order.id)}
    </Link>
  );

  if (order.status === "CANCELLED") {
    return (
      <Message
        icon={<CheckCircle2 className="size-10 text-muted-foreground" />}
        title="This order was cancelled"
        description="The payment was not completed, so no money was taken. Your cart is still saved."
      >
        <Link to="/cart" className={buttonVariants({ variant: "outline" })}>
          Back to the cart
        </Link>
      </Message>
    );
  }

  if (order.status === "PENDING") {
    return (
      <Message
        icon={<Loader2 className="size-10 animate-spin text-muted-foreground" />}
        title="Confirming your payment"
        description={
          query.updateCount >= 15
            ? "This is taking longer than usual. Your order will show as paid in your orders as soon as the payment is confirmed."
            : "Please wait a moment, we are waiting for the confirmation of your payment."
        }
      >
        {query.updateCount >= 15 && orderLink}
      </Message>
    );
  }

  return (
    <Message
      icon={<CheckCircle2 className="size-10 text-primary" />}
      title="Payment received"
      description="Thank you! Your order is confirmed."
    >
      {orderLink}
    </Message>
  );
}
