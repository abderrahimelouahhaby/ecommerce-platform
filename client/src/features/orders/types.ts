// These types describe what the API sends (see docs/api.md).

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentMethod = "COD" | "CARD";
export type PaymentStatus = "UNPAID" | "PAID" | "FAILED";

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  priceCents: number;
  quantity: number;
};

export type Order = {
  id: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalCents: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  createdAt: string;
  items: OrderItem[];
};

export type ShippingInput = {
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

// What we send to create an order: ids, quantities and the address. Never a price.
export type OrderPayload = {
  items: { productId: string; quantity: number }[];
  shipping: ShippingInput;
};
