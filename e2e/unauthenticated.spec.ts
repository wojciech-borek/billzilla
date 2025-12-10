import { expect, test } from "@playwright/test";

test.describe("Unauthenticated User Flows", () => {
  test.describe.configure({ mode: "serial" });

  test("should display login page correctly - visual regression", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Verify page title
    await expect(page).toHaveTitle("Zaloguj się | Billzilla");

    // Verify main elements are visible
    await expect(page.getByRole("heading", { name: "Witaj z powrotem!" })).toBeVisible();
    await expect(page.getByText("Zaloguj się do swojego konta")).toBeVisible();
    await expect(page.getByLabel("Adres e-mail")).toBeVisible();
    await expect(page.getByLabel("Hasło")).toBeVisible();
    await expect(page.getByRole("button", { name: "Zaloguj się" })).toBeVisible();
    await expect(page.getByText("Nie masz konta?")).toBeVisible();
    await expect(page.getByRole("link", { name: "Zarejestruj się" })).toBeVisible();

    // Visual regression test - capture screenshot of the entire login page
    await expect(page).toHaveScreenshot("login-page-initial-state.png", {
      fullPage: true,
      // Allow small pixel differences in CI environment
      maxDiffPixelRatio: process.env.CI ? 0.02 : 0.01,
    });
  });

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

  test("should display signup page correctly - visual regression", async ({ page }) => {
    // Navigate to signup page
    await page.goto("/signup");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Verify page title
    await expect(page).toHaveTitle("Zarejestruj się | Billzilla");

    // Verify main elements are visible
    await expect(page.getByRole("heading", { name: "Dołącz do Billzilla" })).toBeVisible();
    await expect(page.getByText("Zacznij zarządzać wspólnymi wydatkami")).toBeVisible();
    await expect(page.getByLabel("Jak mamy Cię nazywać?")).toBeVisible();
    await expect(page.getByLabel("Adres e-mail")).toBeVisible();
    await expect(page.getByLabel(/^Hasło/)).toBeVisible();
    await expect(page.getByLabel("Powtórz hasło")).toBeVisible();
    await expect(page.getByRole("button", { name: "Zarejestruj się" }).first()).toBeVisible();
    await expect(page.getByText("Masz już konto?")).toBeVisible();
    await expect(page.getByRole("link", { name: "Zaloguj się" })).toBeVisible();

    // Visual regression test - capture screenshot of the entire signup page
    await expect(page).toHaveScreenshot("signup-page-initial-state.png", {
      fullPage: true,
      // Allow small pixel differences in CI environment
      maxDiffPixelRatio: process.env.CI ? 0.02 : 0.01,
    });
  });

  test("should display password reset request page correctly - visual regression", async ({ page }) => {
    // Navigate to password reset page (request mode - no token parameters)
    await page.goto("/reset-password");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Verify page title
    await expect(page).toHaveTitle("Resetowanie hasła | Billzilla");

    // Verify main elements are visible
    await expect(page.getByRole("heading", { name: "Resetowanie hasła" })).toBeVisible();
    await expect(page.getByText("Nie pamiętasz hasła? Pomożemy Ci!")).toBeVisible();
    await expect(page.getByLabel("Adres e-mail")).toBeVisible();
    await expect(page.getByRole("button", { name: "Wyślij link resetujący" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Wróć do logowania" })).toBeVisible();

    // Visual regression test - capture screenshot of the password reset request page
    await expect(page).toHaveScreenshot("password-reset-request-page-initial-state.png", {
      fullPage: true,
      // Allow small pixel differences in CI environment
      maxDiffPixelRatio: process.env.CI ? 0.02 : 0.01,
    });
  });

  test("should display set new password page correctly - visual regression", async ({ page }) => {
    // Navigate to password reset page with recovery token (set new password mode)
    await page.goto("/reset-password?type=recovery&token=dummy_token");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Verify page title
    await expect(page).toHaveTitle("Ustaw nowe hasło | Billzilla");

    // Verify main elements are visible
    await expect(page.getByRole("heading", { name: "Ustaw nowe hasło" })).toBeVisible();
    await expect(page.getByText("Wprowadź nowe hasło do swojego konta.")).toBeVisible();
    await expect(page.getByLabel(/^Nowe hasło/)).toBeVisible();
    await expect(page.getByLabel("Powtórz nowe hasło")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ustaw nowe hasło" })).toBeVisible();

    // Visual regression test - capture screenshot of the set new password page
    await expect(page).toHaveScreenshot("set-new-password-page-initial-state.png", {
      fullPage: true,
      // Allow small pixel differences in CI environment
      maxDiffPixelRatio: process.env.CI ? 0.02 : 0.01,
    });
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
