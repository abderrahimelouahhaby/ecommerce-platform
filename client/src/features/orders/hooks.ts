import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { isNotFound } from "@/lib/api";
import { cancelOrder, fetchOrder, fetchOrders } from "./api";

// The key contains the user id, so the cached orders of one user are never shown to another.
function useOrdersKey() {
  const { user } = useAuth();

  return ["orders", user?.id] as const;
}

export function useOrders() {
  const { isAuthenticated } = useAuth();
  const queryKey = useOrdersKey();

  return useQuery({ queryKey, queryFn: fetchOrders, enabled: isAuthenticated });
}

type UseOrderOptions = {
  // After a card payment: ask again every 2 seconds (up to 15 times) while the order is
  // still pending, because the webhook of Stripe may arrive a moment after the redirect.
  waitForPayment?: boolean;
};

export function useOrder(orderId: string, options: UseOrderOptions = {}) {
  const { isAuthenticated } = useAuth();
  const ordersKey = useOrdersKey();

  return useQuery({
    queryKey: [...ordersKey, "detail", orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: isAuthenticated && orderId !== "",
    // An order that does not exist will not appear if we ask again.
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 1,
    refetchInterval: options.waitForPayment
      ? (query) =>
          query.state.data?.status === "PENDING" && query.state.dataUpdateCount < 15 ? 2000 : false
      : false,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      // The orders changed, and the stock came back, so products must be fetched again.
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}
