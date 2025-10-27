import { expect, test } from "@playwright/test";

test.describe("Unauthenticated User Flows", () => {
  test.describe.configure({ mode: "serial" });

  test("should redirect unauthenticated users to login when accessing dashboard", async ({ page }) => {
    // Navigate to dashboard (should redirect to login)
    await page.goto("/");

    // Verify redirect to login page
    await page.waitForURL("**/login");

    // Verify login page loads
    await expect(page).toHaveTitle(/Billzilla/);

    // Verify login page elements are present
    await expect(page.getByRole("heading", { name: "Witaj z powrotem!" })).toBeVisible();
    await expect(page.getByLabel("Adres e-mail")).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Zaloguj się" })).toBeVisible();
  });

  test("should redirect unauthenticated users to login when accessing create group page", async ({ page }) => {
    // Navigate to create group page (should redirect to login)
    await page.goto("/groups/new");

    // Verify redirect to login page - check if current URL contains /login
    await expect(page).toHaveURL(/\/login/);

    // Verify login page loads
    await expect(page).toHaveTitle(/Billzilla/);

    // Verify login page elements are present
    await expect(page.getByRole("heading", { name: "Witaj z powrotem!" })).toBeVisible();
    await expect(page.getByLabel("Adres e-mail")).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Zaloguj się" })).toBeVisible();
  });
});
