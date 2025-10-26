import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
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
});
