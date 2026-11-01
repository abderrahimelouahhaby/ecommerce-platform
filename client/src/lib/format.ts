const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// The API sends prices in cents (1999 means $19.99).
export function formatPrice(priceCents: number): string {
  return usdFormatter.format(priceCents / 100);
}
