import { expect } from "@playwright/test";
import { DashboardPage } from "./page-objects/dashboard.page";
import { authenticatedTestWithData, GROUP_TEMPLATES } from "./test-fixtures";

// Note: Tests for unauthenticated users are moved to unauthenticated.spec.ts
// These tests assume a logged-in user state

authenticatedTestWithData.describe.serial("Dashboard Visual Regression", () => {
  authenticatedTestWithData("should display dashboard correctly - visual regression", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);

    // Ensure we're on the dashboard and it fully loads
    await authenticatedPage.waitForURL("**/");
    await authenticatedPage.waitForLoadState("networkidle");

    // Wait for main dashboard elements to be visible
    await expect(dashboard.createGroupButton).toBeVisible({ timeout: 10000 });

    // Visual regression test - capture screenshot of the entire dashboard
    await expect(authenticatedPage).toHaveScreenshot("dashboard-initial-state.png", {
      fullPage: true,
      // Allow small pixel differences in CI environment
      maxDiffPixelRatio: process.env.CI ? 0.02 : 0.01,
    });
  });
});

authenticatedTestWithData.describe.serial("Create Group Modal", () => {
  authenticatedTestWithData.describe.configure({ timeout: 120000 });
  authenticatedTestWithData("should open and close create group modal", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);

    // Open create group modal
    const modal = await dashboard.openCreateGroupModal();

    // Verify modal is open
    await expect(modal.modal).toBeVisible();
    await expect(modal.modalTitle).toHaveText("Utwórz nową grupę");

    // Close modal by clicking cancel
    await modal.cancel();

    // Verify modal is closed
    await expect(modal.modal).toBeHidden();
  });

  authenticatedTestWithData("should fill and submit create group form", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);

    // Open create group modal
    const modal = await dashboard.openCreateGroupModal();

    // Fill form data with dynamic test data
    const groupData = GROUP_TEMPLATES.basic();

    await modal.fillGroupForm(groupData);

    // Wait a moment for form to be fully updated
    await authenticatedPage.waitForTimeout(500);

    // Verify form data
    await expect(modal.groupNameInput).toHaveValue(groupData.name);
    const addedEmails = await modal.getEmailInvitations();
    expect(addedEmails).toHaveLength(groupData.emails.length);
    expect(addedEmails).toEqual(groupData.emails);

    // Submit the form
    await modal.submit();

    // Wait for modal to close (success) - longer timeout for slower browsers
    await expect(modal.modal).toBeHidden({ timeout: 15000 });
  });

  authenticatedTestWithData("should create group with many members", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);

    // Open create group modal
    const modal = await dashboard.openCreateGroupModal();

    // Fill form with many members
    const groupData = GROUP_TEMPLATES.withManyMembers();

    await modal.fillGroupForm(groupData);

    // Wait a moment for emails to be displayed
    await authenticatedPage.waitForTimeout(1000);

    // Verify all emails were added
    const addedEmails = await modal.getEmailInvitations();
    expect(addedEmails).toHaveLength(groupData.emails.length);
    expect(addedEmails).toEqual(groupData.emails);

    // Submit the form
    await modal.submit();

    // Wait for modal to close (success) - longer timeout for slower browsers
    await expect(modal.modal).toBeHidden({ timeout: 15000 });
  });

  authenticatedTestWithData("should create group with PLN currency", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);

    const modal = await dashboard.openCreateGroupModal();
    const groupData = GROUP_TEMPLATES.plnCurrency();

    await modal.fillGroupForm(groupData);
    await expect(modal.groupNameInput).toHaveValue(groupData.name);

    await modal.submit();
    await expect(modal.modal).toBeHidden({ timeout: 15000 });
  });

  authenticatedTestWithData("should create group without invitations", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);

    // Ensure we're on the dashboard and create button is visible
    await authenticatedPage.waitForURL("**/");
    await expect(dashboard.createGroupButton).toBeVisible({ timeout: 10000 });

    const modal = await dashboard.openCreateGroupModal();
    const groupData = GROUP_TEMPLATES.noInvitations();

    await modal.fillGroupForm(groupData);
    expect(await modal.getEmailInvitations()).toHaveLength(0);

    // Wait for form to be fully ready
    await authenticatedPage.waitForTimeout(500);

    await modal.submit();
    await expect(modal.modal).toBeHidden({ timeout: 15000 });
  });

  authenticatedTestWithData(
    "should display create group modal correctly - visual regression",
    async ({ authenticatedPage }) => {
      const dashboard = new DashboardPage(authenticatedPage);

      // Open create group modal
      const modal = await dashboard.openCreateGroupModal();

      // Verify modal is open and fully loaded
      await expect(modal.modal).toBeVisible();
      await expect(modal.modalTitle).toHaveText("Utwórz nową grupę");

      // Wait a moment for all animations and content to settle
      await authenticatedPage.waitForTimeout(500);

      // Visual regression test - capture screenshot of the modal
      await expect(modal.modal).toHaveScreenshot("create-group-modal-initial-state.png", {
        // Allow small pixel differences in CI environment
        maxDiffPixelRatio: process.env.CI ? 0.02 : 0.01,
      });

      // Close modal
      await modal.cancel();
      await expect(modal.modal).toBeHidden();
    }
  );

  authenticatedTestWithData("should validate required fields", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);

    // Open create group modal
    const modal = await dashboard.openCreateGroupModal();

    // Try to submit without filling required fields (name is required)
    await modal.submit();

    // Form validation should prevent submission and show error messages
    // Check that we're still on the modal (submission didn't proceed)
    await expect(modal.modal).toBeVisible();

    // Check that validation error is shown for name field
    const nameError = authenticatedPage.locator("#name-error");
    await expect(nameError).toBeVisible();
    await expect(nameError).toHaveText(/wymagana/i);

    // Submit button should still be enabled (validation errors don't disable it)
    await expect(modal.submitButton).toBeEnabled();
  });

  // Cleanup any test data created by the tests in this suite
  authenticatedTestWithData.afterAll(async ({ cleanupTestData }) => {
    await cleanupTestData();
  });
});
