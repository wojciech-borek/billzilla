import { expect } from "@playwright/test";
import { DashboardPage } from "./page-objects/dashboard.page";
import { authenticatedTestWithData, GROUP_TEMPLATES } from "./test-fixtures";

authenticatedTestWithData.describe.serial("Group View Visual Regression", () => {
  authenticatedTestWithData.describe.configure({ timeout: 120000 });

  authenticatedTestWithData(
    "should display group details page correctly - visual regression",
    async ({ authenticatedPage }) => {
      const dashboard = new DashboardPage(authenticatedPage);

      // Create a test group first
      const modal = await dashboard.openCreateGroupModal();
      const groupData = GROUP_TEMPLATES.basic();
      await modal.fillGroupForm(groupData);
      await modal.submit();

      // Wait for modal to close and group creation to complete
      await expect(modal.modal).toBeHidden({ timeout: 15000 });

      // Wait for the new group to appear in the dashboard
      await authenticatedPage.waitForTimeout(2000);

      // Find and click on the newly created group
      // Group cards are rendered as buttons with h3 containing the group name
      const groupCard = authenticatedPage.locator("button").filter({ hasText: groupData.name }).first();
      await expect(groupCard).toBeVisible({ timeout: 10000 });
      await groupCard.click();

      // Wait for group page to load
      await authenticatedPage.waitForLoadState("networkidle");
      await authenticatedPage.waitForURL("**/groups/**", { timeout: 10000 });

      // Verify we're on the group page and main elements are visible
      await expect(authenticatedPage.getByRole("heading", { name: groupData.name })).toBeVisible();

      // Wait a moment for all content to settle
      await authenticatedPage.waitForTimeout(1000);

      // Visual regression test - capture screenshot of the entire group details page
      await expect(authenticatedPage).toHaveScreenshot("group-details-page-initial-state.png", {
        fullPage: true,
        // Allow small pixel differences in CI environment
        maxDiffPixelRatio: process.env.CI ? 0.02 : 0.01,
      });
    }
  );

  // Cleanup any test data created by the tests in this suite
  authenticatedTestWithData.afterAll(async ({ cleanupTestData }) => {
    await cleanupTestData();
  });
});
