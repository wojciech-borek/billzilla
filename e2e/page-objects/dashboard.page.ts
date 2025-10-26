import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly createGroupButton: Locator;
  readonly groupsList: Locator;
  readonly expensesList: Locator;
  readonly userMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    // Create group FAB - fixed position button with aria-label
    this.createGroupButton = page.locator('button[aria-label="Utwórz nową grupę"]');
    // Groups are displayed in a grid, each group is an article with group name
    this.groupsList = page.locator('section').filter({ hasText: 'Twoje grupy' });
    this.expensesList = page.locator('[data-testid="expenses-list"]');
    // User menu - assuming there's a user avatar or menu button (need to check actual implementation)
    this.userMenu = page.locator('button').filter({ hasText: /user|profile|account/i }).or(
      page.locator('[aria-label*="user"]').or(
        page.locator('[aria-label*="profile"]').or(
          page.locator('[aria-label*="account"]')
        )
      )
    );
  }

  async goto() {
    await this.page.goto('/');
  }

  async isLoaded() {
    await this.page.waitForURL('**/');
    return this.page.url().includes('/');
  }

  async clickCreateGroup() {
    await this.createGroupButton.click();
  }

  // Click add expense button on the first available group
  async clickAddExpense() {
    const firstGroupCard = this.page.locator('article').filter({ hasText: 'Dodaj wydatek' }).first();
    const addExpenseButton = firstGroupCard.locator('button').filter({ hasText: 'Dodaj wydatek' });
    await addExpenseButton.click();
  }

  async logout() {
    // Try to find and click user menu/avatar
    const userMenu = this.page.locator('button[aria-label*="user"]').or(
      this.page.locator('button[aria-label*="profile"]').or(
        this.page.locator('img[alt*="avatar"]').locator('..')
      )
    );

    if (await userMenu.isVisible()) {
      await userMenu.click();
      // Look for logout option
      await this.page.getByRole('menuitem', { name: /logout|wyloguj/i }).click();
    } else {
      // Fallback: try to find logout link/button anywhere on page
      await this.page.getByRole('button', { name: /logout|wyloguj/i }).click();
    }
  }

  async getGroupCount() {
    return await this.groupsList.locator('article').count();
  }

  async getExpenseCount() {
    return await this.expensesList.locator('li').count();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
