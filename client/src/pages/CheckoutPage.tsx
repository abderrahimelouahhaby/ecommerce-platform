import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/useAuth";
import { useCart } from "@/features/cart/useCart";
import { createCheckoutSession, createOrder } from "@/features/orders/api";
import { checkoutSchema, type CheckoutValues } from "@/features/orders/schemas";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getErrorMessage } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export function CheckoutPage() {
  usePageTitle("Checkout");

  const { items, itemCount, subtotalCents, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  // Once the order exists, an empty cart must not send us to /cart anymore.
  const [orderPlaced, setOrderPlaced] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: user?.name ?? "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      country: "Morocco",
      paymentMethod: "COD",
    },
  });

  const paymentMethod = watch("paymentMethod");

  // Nothing to buy: back to the cart. Not after placing an order: the cart is emptied
  // right after the navigation to the order page.
  if (items.length === 0 && !orderPlaced) {
    return <Navigate to="/cart" replace />;
  }

  async function onSubmit(values: CheckoutValues) {
    setServerError(null);

    const { paymentMethod: method, ...shipping } = values;
    // Only ids and quantities. The server reads the real prices from the database.
    const payload = {
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      shipping,
    };

    try {
      if (method === "CARD") {
        const { url } = await createCheckoutSession(payload);

        // The cart stays until the payment is confirmed (see the success page).
        setRedirecting(true);
        window.location.assign(url);
        return;
      }

      const order = await createOrder(payload);

      // The stock changed, so products are fetched again. Orders too.
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });

      // Go to the order first, then empty the cart. orderPlaced stops the empty-cart
      // redirect above from firing while the navigation is still in progress.
      setOrderPlaced(true);
      navigate(`/orders/${order.id}?placed=1`);
      clear();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  const busy = isSubmitting || redirecting;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_22rem]"
      >
        <div className="flex flex-col gap-8">
          <section aria-labelledby="shipping-heading" className="flex flex-col gap-4">
            <h2 id="shipping-heading" className="text-xl font-semibold">
              Delivery address
            </h2>
            <FormField
              id="name"
              label="Full name"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
            <FormField
              id="phone"
              label="Phone"
              type="tel"
              autoComplete="tel"
              error={errors.phone?.message}
              {...register("phone")}
            />
            <FormField
              id="address"
              label="Address"
              autoComplete="street-address"
              error={errors.address?.message}
              {...register("address")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="city"
                label="City"
                autoComplete="address-level2"
                error={errors.city?.message}
                {...register("city")}
              />
              <FormField
                id="postalCode"
                label="Postal code"
                autoComplete="postal-code"
                error={errors.postalCode?.message}
                {...register("postalCode")}
              />
            </div>
            <FormField
              id="country"
              label="Country"
              autoComplete="country-name"
              error={errors.country?.message}
              {...register("country")}
            />
          </section>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-xl font-semibold">Payment method</legend>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-checked:border-primary">
              <input type="radio" value="COD" className="mt-1" {...register("paymentMethod")} />
              <span>
                <span className="block font-medium">Cash on delivery</span>
                <span className="block text-sm text-muted-foreground">
                  Pay in cash when your order arrives.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-checked:border-primary">
              <input type="radio" value="CARD" className="mt-1" {...register("paymentMethod")} />
              <span>
                <span className="block font-medium">Card</span>
                <span className="block text-sm text-muted-foreground">
                  Pay securely on the Stripe page. This demo uses test cards only.
                </span>
              </span>
            </label>
          </fieldset>
        </div>

        <aside aria-label="Order summary">
          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ul className="flex flex-col gap-2 text-sm">
                {items.map((item) => (
                  <li key={item.productId} className="flex justify-between gap-2">
                    <span>
                      {item.quantity} x {item.name}
                    </span>
                    <span className="shrink-0">{formatPrice(item.priceCents * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-muted-foreground">
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
                <span className="text-lg font-semibold">{formatPrice(subtotalCents)}</span>
              </div>

              <p className="text-sm text-muted-foreground">
                Delivery is free in this demo. Prices and stock are confirmed when you place your
                order.
              </p>

              {serverError && (
                <p role="alert" className="text-sm text-destructive">
                  {serverError}
                </p>
              )}

              <Button type="submit" size="lg" disabled={busy}>
                {redirecting
                  ? "Redirecting to payment..."
                  : isSubmitting
                    ? "Placing order..."
                    : paymentMethod === "CARD"
                      ? "Pay by card"
                      : "Place order"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
