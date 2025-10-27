import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Global setup for Playwright E2E tests
 * Authenticates once and saves session state to reuse across tests
 */
async function globalSetup() {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!username || !password) {
    throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables are required");
  }

  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY environment variables are required");
  }

  console.log("Setting up authenticated session state...");

  // Launch browser for authentication
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // First authenticate with Supabase API to ensure RLS works
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (signInError) {
      throw new Error(`Supabase authentication failed: ${signInError.message}`);
    }

    console.log("Supabase authentication successful");

    // Navigate to login page
    await page.goto("http://localhost:3000/login");

    // Wait for login page to load
    await page.waitForLoadState("networkidle");

    // Fill and submit login form
    const emailInput = page.getByLabel("Adres e-mail");
    const passwordInput = page.getByLabel("Hasło");

    await emailInput.fill(username);
    await passwordInput.fill(password);

    // Click login button
    await page.getByRole("button", { name: "Zaloguj się" }).click();

    // Wait for dashboard to load (authentication success)
    await page.waitForURL("**/", { timeout: 15000 });

    // Verify we're logged in
    const createGroupButton = page.getByTestId("create-group-button");
    await createGroupButton.waitFor({ state: "visible", timeout: 5000 });

    console.log("UI authentication successful");

    // Save the authenticated session state
    await context.storageState({ path: "e2e/.auth/user.json" });

    console.log("Session state saved to e2e/.auth/user.json");
  } catch (error) {
    console.error("Authentication setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
