import { XCircle } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCancelOrder } from "@/features/orders/hooks";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getErrorMessage } from "@/lib/api";

export function CheckoutCancelledPage() {
  usePageTitle("Payment cancelled");

  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order") ?? "";
  const navigate = useNavigate();
  const cancel = useCancelOrder();

  if (orderId === "") {
    return <Navigate to="/cart" replace />;
  }

  function handleCancelOrder() {
    cancel.mutate(orderId, {
      onSuccess: () => {
        toast.success("Order cancelled. Your items are back in stock.");
        navigate("/cart");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <XCircle className="size-10 text-muted-foreground" />
      <h1 className="text-2xl font-bold tracking-tight">Payment cancelled</h1>
      <p className="text-muted-foreground">
        You were not charged, and your cart is still saved. The items of this order are kept for you
        for about 30 minutes. You can cancel the order now to put them back on sale.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/cart" className={buttonVariants()}>
          Back to the cart
        </Link>
        <Button variant="outline" disabled={cancel.isPending} onClick={handleCancelOrder}>
          Cancel this order
        </Button>
      </div>
    </section>
  );
}
