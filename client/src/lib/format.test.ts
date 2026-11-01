import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";

describe("formatPrice", () => {
  it.each([
    { cents: 0, expected: "$0.00" },
    { cents: 5, expected: "$0.05" },
    { cents: 1999, expected: "$19.99" },
    { cents: 69900, expected: "$699.00" },
    { cents: 100000, expected: "$1,000.00" },
  ])("formats $cents cents as $expected", ({ cents, expected }) => {
    expect(formatPrice(cents)).toBe(expected);
  });
});
