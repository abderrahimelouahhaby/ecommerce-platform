const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// The API sends prices in cents (1999 means $19.99).
export function formatPrice(priceCents: number): string {
  return usdFormatter.format(priceCents / 100);
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

// "2026-11-13T10:30:00.000Z" becomes something like "Nov 13, 2026, 10:30 AM".
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

// A short, readable order number made from the start of the id.
export function formatOrderNumber(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}
