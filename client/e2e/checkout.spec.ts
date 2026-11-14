import { expect, test, type Page } from "@playwright/test";
import { registerThroughUi } from "./helpers";

const PRODUCT_SLUG = "orbit-braided-usb-c-cable-2m";

async function addProductToCart(page: Page) {
  await page.goto(`/products/${PRODUCT_SLUG}`);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("button", { name: /Open cart, 1 item/ })).toBeVisible();
}

async function fillShipping(page: Page) {
  await page.getByLabel("Full name").fill("E2E Customer");
  await page.getByLabel("Phone").fill("+212 600 000 000");
  await page.getByLabel("Address", { exact: true }).fill("12 Example Street");
  await page.getByLabel("City").fill("Casablanca");
  await page.getByLabel("Postal code").fill("20000");
  await page.getByLabel("Country").fill("Morocco");
}

// A new customer buys one product with cash on delivery. Ends on the order page.
async function placeCashOnDeliveryOrder(page: Page) {
  await registerThroughUi(page);
  await addProductToCart(page);
  await page.goto("/checkout");
  await fillShipping(page);
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}\?placed=1/);
}

test("a customer can place a cash on delivery order and sees it in the history", async ({
  page,
}) => {
  await placeCashOnDeliveryOrder(page);

  await expect(page.getByText("Thank you, your order is placed")).toBeVisible();
  await expect(page.getByText("Pending", { exact: true })).toBeVisible();
  // The cart is empty now: the cart button has no number.
  await expect(page.getByRole("button", { name: "Open cart", exact: true })).toBeVisible();

  await page.goto("/orders");

  await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();
  await expect(page.getByText("Pending", { exact: true })).toBeVisible();
});

test("a customer can cancel a pending order", async ({ page }) => {
  await placeCashOnDeliveryOrder(page);

  await page.getByRole("button", { name: "Cancel order" }).click();
  await page.getByRole("button", { name: "Yes, cancel order" }).click();

  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel order" })).toHaveCount(0);
});

test("a customer cannot open the order of another customer", async ({ page, browser, baseURL }) => {
  await placeCashOnDeliveryOrder(page);
  const orderId = new URL(page.url()).pathname.split("/").pop() ?? "";

  // A second customer, in a separate browser session.
  const otherContext = await browser.newContext({ baseURL });
  const otherPage = await otherContext.newPage();
  await registerThroughUi(otherPage);
  await otherPage.goto(`/orders/${orderId}`);

  await expect(otherPage.getByRole("heading", { name: "Order not found" })).toBeVisible();

  await otherContext.close();
});

test("a card payment sends only ids and quantities, then goes to the payment page", async ({
  page,
  baseURL,
}) => {
  let requestBody: unknown;

  // We replace the answer of the server: no real Stripe page is needed.
  await page.route("**/api/payments/checkout-session", async (route) => {
    requestBody = route.request().postDataJSON();

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: { orderId: "mock-order", url: `${baseURL}/shop?mock-payment=1` },
      }),
    });
  });

  await registerThroughUi(page);
  await addProductToCart(page);
  await page.goto("/checkout");
  await fillShipping(page);
  await page.getByRole("radio", { name: /Card/ }).check();
  await page.getByRole("button", { name: "Pay by card" }).click();

  await expect(page).toHaveURL(/mock-payment=1/);
  // toEqual compares every key: a price field would make this test fail.
  expect(requestBody).toEqual({
    items: [{ productId: expect.any(String), quantity: 1 }],
    shipping: {
      name: "E2E Customer",
      phone: "+212 600 000 000",
      address: "12 Example Street",
      city: "Casablanca",
      postalCode: "20000",
      country: "Morocco",
    },
  });
});
