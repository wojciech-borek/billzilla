import { Page, Locator, expect } from "@playwright/test";

export class GroupPage {
  readonly page: Page;
  readonly groupHeader: Locator;
  readonly optionsMenuButton: Locator;
  readonly archiveOption: Locator;
  readonly archiveConfirmDialog: Locator;
  readonly confirmArchiveButton: Locator;
  readonly cancelArchiveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.groupHeader = page.locator("header").first();
    this.optionsMenuButton = page.getByRole("button", { name: /options|więcej|opcje/i });
    this.archiveOption = page.getByRole("menuitem", { name: /archive|archiwizuj/i });
    this.archiveConfirmDialog = page.getByRole("dialog");
    this.confirmArchiveButton = this.archiveConfirmDialog.getByRole("button", {
      name: /confirm|potwierdź|archiwizuj/i,
    });
    this.cancelArchiveButton = this.archiveConfirmDialog.getByRole("button", { name: /cancel|anuluj/i });
  }

  /**
   * Wait for group page to load
   */
  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
    await this.groupHeader.waitFor({ state: "visible" });
  }

  /**
   * Open the options/more menu
   */
  async openOptionsMenu() {
    await this.optionsMenuButton.click();
    await this.archiveOption.waitFor({ state: "visible" });
  }

  /**
   * Click the archive option in the menu
   */
  async clickArchiveOption() {
    await this.archiveOption.click();
  }

  /**
   * Confirm archiving in the confirmation dialog
   */
  async confirmArchive() {
    await this.confirmArchiveButton.click();
  }

  /**
   * Cancel archiving in the confirmation dialog
   */
  async cancelArchive() {
    await this.cancelArchiveButton.click();
  }

  /**
   * Verify the archive confirmation dialog is visible
   */
  async verifyArchiveDialogVisible() {
    await expect(this.archiveConfirmDialog).toBeVisible();
  }

  /**
   * Complete full archive flow: open menu, click archive, confirm
   */
  async archiveGroup() {
    await this.openOptionsMenu();
    await this.clickArchiveOption();
    await this.verifyArchiveDialogVisible();
    await this.confirmArchive();
  }
}
