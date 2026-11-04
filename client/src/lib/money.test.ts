import { describe, expect, it } from "vitest";
import { dollarsToCents } from "./money";

describe("dollarsToCents", () => {
  it.each([
    { input: "19.99", cents: 1999 },
    { input: "0.29", cents: 29 },
    { input: "699", cents: 69900 },
    { input: "1000.5", cents: 100050 },
    { input: " 5 ", cents: 500 },
  ])("converts $input to $cents cents", ({ input, cents }) => {
    expect(dollarsToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "-5", "12.345", "1e3"])("rejects %j", (input) => {
    expect(dollarsToCents(input)).toBeUndefined();
  });
});
