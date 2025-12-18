import { Page, Locator, expect } from "@playwright/test";
import { CreateGroupModal } from "./create-group-modal.page";

export class DashboardPage {
  readonly page: Page;
  readonly createGroupButton: Locator;
  readonly groupsList: Locator;
  readonly expensesList: Locator;
  readonly userMenu: Locator;
  private readonly toasts: Locator;

  constructor(page: Page) {
    this.page = page;
    // Create group FAB - fixed position button with data-testid
    this.createGroupButton = page.getByTestId("create-group-button");
    // Groups are displayed in a grid, each group is an article with group name
    this.groupsList = page.locator("section").filter({ hasText: "Twoje grupy" });
    this.expensesList = page.locator('[data-testid="expenses-list"]');
    // User menu - assuming there's a user avatar or menu button (need to check actual implementation)
    this.userMenu = page
      .locator("button")
      .filter({ hasText: /user|profile|account/i })
      .or(
        page
          .locator('[aria-label*="user"]')
          .or(page.locator('[aria-label*="profile"]').or(page.locator('[aria-label*="account"]')))
      );
    this.toasts = page.locator("[data-sonner-toast]");
  }

  async goto() {
    await this.page.goto("/");
  }

  async isLoaded() {
    await this.page.waitForURL("**/");
    return this.page.url().includes("/");
  }

  async clickCreateGroup() {
    // Ensure button is visible and clickable before clicking
    await this.createGroupButton.waitFor({ state: "visible", timeout: 10000 });
    await expect(this.createGroupButton).toBeEnabled();

    // Scroll button into view and ensure it's clickable
    await this.createGroupButton.scrollIntoViewIfNeeded();

    // Click the button (modal opening will be awaited by caller)
    await this.createGroupButton.click();
  }

  /**
   * Open create group modal and return modal page object
   */
  async openCreateGroupModal(): Promise<CreateGroupModal> {
    // Ensure any existing modal is closed first
    const existingModal = this.page.getByTestId("create-group-modal");
    if (await existingModal.isVisible()) {
      await this.page.keyboard.press("Escape");
      await existingModal.waitFor({ state: "hidden", timeout: 5000 });
    }

    // Wait for any toasts to disappear
    await this.waitForNoToasts();

    // Click the create group button
    await this.createGroupButton.waitFor({ state: "visible", timeout: 10000 });
    await expect(this.createGroupButton).toBeEnabled();
    await this.createGroupButton.scrollIntoViewIfNeeded();
    await this.createGroupButton.click();

    const modal = new CreateGroupModal(this.page);
    await modal.waitForModal();

    return modal;
  }

  /**
   * Wait for Sonner toasts to disappear to avoid overlay blocking clicks
   */
  private async waitForNoToasts() {
    try {
      await expect(this.toasts).toHaveCount(0, { timeout: 5000 });
    } catch {
      // As a fallback, proceed; clicking will retry with force if needed
    }
  }

  // Click add expense button on the first available group
  async clickAddExpense() {
    const firstGroupCard = this.page.locator("article").filter({ hasText: "Dodaj wydatek" }).first();
    const addExpenseButton = firstGroupCard.locator("button").filter({ hasText: "Dodaj wydatek" });
    await addExpenseButton.click();
  }

  async logout() {
    // Try to find and click user menu/avatar
    const userMenu = this.page
      .locator('button[aria-label*="user"]')
      .or(this.page.locator('button[aria-label*="profile"]').or(this.page.locator('img[alt*="avatar"]').locator("..")));

    if (await userMenu.isVisible()) {
      await userMenu.click();
      // Look for logout option
      await this.page.getByRole("menuitem", { name: /logout|wyloguj/i }).click();
    } else {
      // Fallback: try to find logout link/button anywhere on page
      await this.page.getByRole("button", { name: /logout|wyloguj/i }).click();
    }
  }

  async getGroupCount() {
    return await this.groupsList.locator("article").count();
  }

  async getExpenseCount() {
    return await this.expensesList.locator("li").count();
  }

  /**
   * Switch to archived groups tab/view
   */
  async switchToArchivedGroups() {
    const archivedTab = this.page.getByRole("tab", { name: /archived|archiwum/i });
    await archivedTab.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Switch to active groups tab/view
   */
  async switchToActiveGroups() {
    const activeTab = this.page.getByRole("tab", { name: /active|aktywne/i });
    await activeTab.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Find a group card by name
   */
  async findGroupByName(name: string) {
    return this.page.locator("button").filter({ hasText: name }).first();
  }

  /**
   * Verify that a group is not in the current list
   */
  async verifyGroupNotInList(name: string) {
    const groupCard = await this.findGroupByName(name);
    await expect(groupCard).not.toBeVisible();
  }
}
