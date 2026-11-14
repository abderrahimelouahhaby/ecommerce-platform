import { api } from "@/lib/api";
import type { Order, OrderPayload } from "./types";

export async function createOrder(payload: OrderPayload): Promise<Order> {
  const { data } = await api.post<{ data: Order }>("/orders", payload);

  return data.data;
}

// Creates a card order and a Stripe payment page. Returns the address of that page.
export async function createCheckoutSession(
  payload: OrderPayload,
): Promise<{ orderId: string; url: string }> {
  const { data } = await api.post<{ data: { orderId: string; url: string } }>(
    "/payments/checkout-session",
    payload,
  );

  // Only http and https addresses. This blocks values like "javascript:...".
  if (!/^https?:\/\//.test(data.data.url)) {
    throw new Error("Invalid payment page address");
  }

  return data.data;
}

export async function fetchOrders(): Promise<Order[]> {
  const { data } = await api.get<{ data: Order[] }>("/orders");

  return data.data;
}

export async function fetchOrder(orderId: string): Promise<Order> {
  const { data } = await api.get<{ data: Order }>(`/orders/${encodeURIComponent(orderId)}`);

  return data.data;
}

export async function cancelOrder(orderId: string): Promise<Order> {
  const { data } = await api.post<{ data: Order }>(`/orders/${encodeURIComponent(orderId)}/cancel`);

  return data.data;
}
