// Up to 7 digits, then optionally a dot and 1 or 2 decimals: "19", "19.9", "19.99".
export const DOLLAR_AMOUNT = /^\d{1,7}(\.\d{1,2})?$/;

// Converts what a user typed ("19.99") to cents (1999).
// Returns undefined when the text is empty or not a valid amount.
export function dollarsToCents(value: string): number | undefined {
  const text = value.trim();

  if (!DOLLAR_AMOUNT.test(text)) {
    return undefined;
  }

  return Math.round(Number(text) * 100);
}
