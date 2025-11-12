/* eslint-disable no-empty-pattern */
/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, Page, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Generate unique test data for E2E tests
 */
export const generateTestData = {
  /**
   * Generate unique group name with timestamp
   */
  groupName: (prefix = "Test Group") => {
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2, 8);
    const random2 = Math.random().toString(36).substring(2, 8);
    return `${prefix} ${timestamp}-${random1}-${random2}`;
  },

  /**
   * Generate unique email address
   */
  email: (prefix = "testuser") => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}+${timestamp}-${random}@example.com`;
  },

  /**
   * Generate array of unique email addresses
   */
  emails: (count: number, prefix = "friend") => {
    return Array.from({ length: count }, (_, i) => generateTestData.email(`${prefix}${i + 1}`));
  },

  /**
   * Generate complete group creation data
   */
  groupCreationData: (overrides = {}) => {
    return {
      name: generateTestData.groupName(),
      currency: "USD",
      emails: generateTestData.emails(2),
      ...overrides,
    };
  },

  /**
   * Generate user credentials for testing
   */
  userCredentials: (overrides = {}) => {
    // Use environment variable password if available, otherwise generate one
    const password =
      process.env.E2E_PASSWORD ||
      (() => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `Pass${timestamp}${random}!`;
      })();
    return {
      email: generateTestData.email("user"),
      password: password,
      fullName: "Test User",
      ...overrides,
    };
  },
};

/**
 * Playwright test fixture with test data
 */
export const test = base.extend<{
  testData: typeof generateTestData;
}>({
  testData: async ({}, use) => {
    await use(generateTestData);
  },
});

/**
 * Authenticated test fixture using storageState
 * Relies on Playwright's globalSetup to have authenticated session state
 */
export const authenticatedTest = base.extend<{
  authenticatedPage: Page;
  cleanupTestData: () => Promise<void>;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Get credentials from environment variables for fallback
    const username = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!username || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables are required for authenticated tests");
    }

    // Navigate to dashboard - storageState should already be loaded by Playwright
    await page.goto("/");

    // Check if we're already authenticated (storageState worked)
    const createGroupButton = page.getByTestId("create-group-button");

    try {
      await expect(createGroupButton).toBeVisible({ timeout: 3000 });
      console.log("Already authenticated via storageState");
    } catch (_error) {
      // StorageState didn't work, perform UI login
      console.log("StorageState not loaded, performing UI login...");

      // Navigate to login page
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // Fill and submit login form
      const emailInput = page.getByLabel("Adres e-mail");
      const passwordInput = page.getByLabel("Hasło");

      await emailInput.fill(username);
      await passwordInput.fill(password);
      await page.getByRole("button", { name: "Zaloguj się" }).click();

      // Wait for dashboard to load
      await page.waitForURL("**/", { timeout: 10000 });

      // Verify we're on dashboard
      await expect(createGroupButton).toBeVisible({ timeout: 5000 });
    }

    await use(page);
  },

  cleanupTestData: async ({}, use) => {
    // Cleanup function that removes test data
    const cleanup = async () => {
      try {
        const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
        const username = process.env.E2E_USERNAME;
        const password = process.env.E2E_PASSWORD;

        if (!supabaseUrl || !supabaseKey || !username || !password) {
          return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Sign in to get proper RLS context
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: username,
          password: password,
        });

        if (signInError) {
          return;
        }

        // Delete test groups created during tests in a single query
        await supabase.from("groups").delete().like("name", "Test Group%");

        // Don't sign out to preserve browser session for subsequent tests
      } catch (_error) {
        // Cleanup errors are logged but don't fail the test
      }
    };

    await use(cleanup);
  },
});

/**
 * Test data with authenticated user
 */
export const authenticatedTestWithData = authenticatedTest.extend<{
  testData: typeof generateTestData;
}>({
  testData: async ({}, use) => {
    await use(generateTestData);
  },
});

/**
 * Common currencies for testing
 */
export const TEST_CURRENCIES = {
  PLN: "PLN",
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
} as const;

/**
 * Test group templates for different scenarios
 */
export const GROUP_TEMPLATES = {
  basic: () => generateTestData.groupCreationData(),
  withManyMembers: () =>
    generateTestData.groupCreationData({
      emails: generateTestData.emails(3),
    }),
  plnCurrency: () =>
    generateTestData.groupCreationData({
      currency: TEST_CURRENCIES.PLN,
    }),
  noInvitations: () =>
    generateTestData.groupCreationData({
      emails: [],
    }),
} as const;
