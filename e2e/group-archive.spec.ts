import { expect } from "@playwright/test";
import { DashboardPage } from "./page-objects/dashboard.page";
import { GroupPage } from "./page-objects/group.page";
import { authenticatedTestWithData, GROUP_TEMPLATES } from "./test-fixtures";

authenticatedTestWithData.describe.serial("Group Archive", () => {
  authenticatedTestWithData.describe.configure({ timeout: 120000 });

  authenticatedTestWithData("should archive group successfully from group dashboard", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);

    // Create a test group first
    const modal = await dashboard.openCreateGroupModal();
    const groupData = GROUP_TEMPLATES.basic();
    await modal.fillGroupForm(groupData);
    await modal.submit();

    // Wait for modal to close and group creation to complete
    await expect(modal.modal).toBeHidden({ timeout: 15000 });
    await authenticatedPage.waitForLoadState("networkidle");

    // Navigate to the newly created group
    const groupCard = await dashboard.findGroupByName(groupData.name);
    await expect(groupCard).toBeVisible({ timeout: 10000 });
    await groupCard.click();

    // Wait for group page to load
    const groupPage = new GroupPage(authenticatedPage);
    await groupPage.waitForLoad();

    // Archive the group
    await groupPage.archiveGroup();

    // Wait for redirect to dashboard
    await authenticatedPage.waitForURL("**/", { timeout: 10000 });

    // Verify success toast
    const successToast = authenticatedPage.locator("[data-sonner-toast]").filter({
      hasText: /zarchiwizowana/i,
    });
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Verify group is not in active groups list
    await dashboard.verifyGroupNotInList(groupData.name);
  });

  authenticatedTestWithData("should display archived group in archived groups list", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);

    // Create and archive a group
    const modal = await dashboard.openCreateGroupModal();
    const groupData = GROUP_TEMPLATES.basic();
    await modal.fillGroupForm(groupData);
    await modal.submit();

    await expect(modal.modal).toBeHidden({ timeout: 15000 });
    await authenticatedPage.waitForLoadState("networkidle");

    // Navigate to group and archive it
    const groupCard = await dashboard.findGroupByName(groupData.name);
    await groupCard.click();

    const groupPage = new GroupPage(authenticatedPage);
    await groupPage.waitForLoad();
    await groupPage.archiveGroup();

    // Wait for redirect to dashboard
    await authenticatedPage.waitForURL("**/", { timeout: 10000 });

    // Switch to archived groups view
    await dashboard.switchToArchivedGroups();

    // Verify the group appears in archived list
    const archivedGroupCard = await dashboard.findGroupByName(groupData.name);
    await expect(archivedGroupCard).toBeVisible({ timeout: 10000 });
  });

  authenticatedTestWithData("should show confirmation dialog before archiving", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);

    // Create a test group
    const modal = await dashboard.openCreateGroupModal();
    const groupData = GROUP_TEMPLATES.basic();
    await modal.fillGroupForm(groupData);
    await modal.submit();

    await expect(modal.modal).toBeHidden({ timeout: 15000 });
    await authenticatedPage.waitForLoadState("networkidle");

    // Navigate to the group
    const groupCard = await dashboard.findGroupByName(groupData.name);
    await groupCard.click();

    const groupPage = new GroupPage(authenticatedPage);
    await groupPage.waitForLoad();

    // Open archive menu and click archive
    await groupPage.openOptionsMenu();
    await groupPage.clickArchiveOption();

    // Verify confirmation dialog appears
    await groupPage.verifyArchiveDialogVisible();

    // Cancel the operation
    await groupPage.cancelArchive();

    // Verify we're still on the group page (not redirected)
    await expect(authenticatedPage).toHaveURL(/groups\/[a-z0-9-]+/, { timeout: 5000 });

    // Verify group is still active (navigate back to dashboard)
    await authenticatedPage.goto("/");
    const activeGroupCard = await dashboard.findGroupByName(groupData.name);
    await expect(activeGroupCard).toBeVisible({ timeout: 10000 });
  });

  // Cleanup any test data created by the tests in this suite
  authenticatedTestWithData.afterAll(async ({ cleanupTestData }) => {
    await cleanupTestData();
  });
});
