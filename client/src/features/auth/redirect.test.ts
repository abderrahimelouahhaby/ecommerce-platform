import { describe, expect, it } from "vitest";
import { getSafeRedirect } from "./redirect";

describe("getSafeRedirect", () => {
  it.each(["/", "/shop", "/orders?page=2"])("keeps the local path %s", (path) => {
    expect(getSafeRedirect(path)).toBe(path);
  });

  it.each([
    "//evil.com",
    "https://evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "/ with space",
    "",
    null,
    undefined,
  ])("replaces the unsafe value %s with the fallback", (value) => {
    expect(getSafeRedirect(value)).toBe("/");
  });
});
