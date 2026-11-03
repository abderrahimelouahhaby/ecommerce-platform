import { expect, test } from "@playwright/test";
import { logInThroughUi, logOut, registerThroughUi } from "./helpers";

test("a visitor can register, log out and log in again", async ({ page }) => {
  const email = await registerThroughUi(page);
  await logOut(page);

  await page.goto("/login");
  await logInThroughUi(page, email);

  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});

test("a protected page sends a visitor to login and back after login", async ({ page }) => {
  const email = await registerThroughUi(page);
  await logOut(page);

  await page.goto("/orders");
  await expect(page).toHaveURL(/\/login\?redirect=%2Forders/);

  await logInThroughUi(page, email);

  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
});

test("a visitor cannot open the admin area", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin/);
});

test("a customer cannot open the admin area", async ({ page }) => {
  await registerThroughUi(page);

  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
});
