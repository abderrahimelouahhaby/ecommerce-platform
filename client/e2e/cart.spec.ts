import { expect, test } from "@playwright/test";

test("a visitor can fill the cart, change a quantity and keep the cart after a reload", async ({
  page,
}) => {
  await page.goto("/products/orbit-braided-usb-c-cable-2m");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("button", { name: /Open cart, 1 item/ })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Cart", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Orbit Braided USB-C Cable 2m" })).toBeVisible();

  const summary = page.getByRole("region", { name: "Order summary" });
  await expect(summary.getByText("$12.00")).toBeVisible();

  await page
    .getByRole("button", { name: "Increase quantity of Orbit Braided USB-C Cable 2m" })
    .click();
  await expect(summary.getByText("$24.00")).toBeVisible();

  await page.reload();
  await expect(summary.getByText("$24.00")).toBeVisible();
});

test("a product that is out of stock cannot be added to the cart", async ({ page }) => {
  await page.goto("/products/nimbus-slim-14-laptop");

  await expect(page.getByRole("button", { name: "Out of stock" })).toBeDisabled();
});
