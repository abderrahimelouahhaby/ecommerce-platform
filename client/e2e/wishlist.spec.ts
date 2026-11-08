import { expect, test } from "@playwright/test";
import { registerThroughUi } from "./helpers";

test("a customer can save a product and remove it from the wishlist page", async ({ page }) => {
  await registerThroughUi(page);

  await page.goto("/products/nova-x1-smartphone");
  await page.getByRole("button", { name: "Add to wishlist" }).click();
  await expect(page.getByRole("button", { name: "Saved to wishlist" })).toBeVisible();

  await page.goto("/wishlist");
  await expect(page.getByRole("link", { name: /Nova X1 Smartphone/ })).toBeVisible();

  await page.getByRole("button", { name: "Remove Nova X1 Smartphone from wishlist" }).click();
  await expect(page.getByText("Your wishlist is empty")).toBeVisible();
});

test("a visitor who clicks a heart is sent to the login page", async ({ page }) => {
  await page.goto("/shop?category=smartphones");

  await page.getByRole("button", { name: "Add Nova X1 Smartphone to wishlist" }).click();

  await expect(page).toHaveURL(/\/login\?redirect=%2Fshop/);
});
