import { expect, test } from "@playwright/test";

test("a visitor can filter the shop by category and open a product", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.getByRole("heading", { name: "Shop", exact: true })).toBeVisible();

  await page.getByRole("button", { name: /^Laptops/ }).click();

  await expect(page).toHaveURL(/category=laptops/);
  await expect(page.getByText("6 products", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Voltix Air 14 Laptop/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Nova X1 Smartphone/ })).toHaveCount(0);

  await page.getByRole("link", { name: /Voltix Air 14 Laptop/ }).click();

  await expect(page).toHaveURL(/\/products\/voltix-air-14-laptop$/);
  await expect(page.getByRole("heading", { name: "Voltix Air 14 Laptop" })).toBeVisible();
  await expect(page.getByText("$899.00")).toBeVisible();
});

test("an unknown product shows a not found message", async ({ page }) => {
  await page.goto("/products/does-not-exist");

  await expect(page.getByRole("heading", { name: "Product not found" })).toBeVisible();
});
