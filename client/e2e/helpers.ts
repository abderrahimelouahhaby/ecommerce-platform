import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";

export const PASSWORD = "E2e-password-123";

// Registers a new customer through the real register page. The user ends up logged in.
export async function registerThroughUi(page: Page): Promise<string> {
  const email = `e2e-${randomUUID().slice(0, 8)}@example.test`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

  return email;
}

export async function logOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
}

export async function logInThroughUi(page: Page, email: string): Promise<void> {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
}
