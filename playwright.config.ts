import { config } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

config({ path: ".env.test" });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  /* Global setup to authenticate and save session state */
  globalSetup: "./e2e/global-setup.ts",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { open: "never" }], ["list"]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Take screenshot on failure */
    screenshot: "only-on-failure",

    /* Ensure consistent viewport for visual regression tests across all environments */
    viewport: { width: 1280, height: 720 },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      testIgnore: "**/unauthenticated.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./e2e/.auth/user.json",
      },
    },

    {
      name: "firefox",
      testIgnore: "**/unauthenticated.spec.ts",
      use: {
        ...devices["Desktop Firefox"],
        storageState: "./e2e/.auth/user.json",
      },
    },

    {
      name: "webkit",
      testIgnore: "**/unauthenticated.spec.ts",
      use: {
        ...devices["Desktop Safari"],
        storageState: "./e2e/.auth/user.json",
      },
    },

    /* Project for tests that don't require authentication */
    {
      name: "unauthenticated-chromium",
      testMatch: "**/unauthenticated.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        // No storageState - starts with clean session
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      ...(Object.fromEntries(Object.entries(process.env).filter(([_, value]) => value !== undefined)) as Record<
        string,
        string
      >),
    },
  },
});
