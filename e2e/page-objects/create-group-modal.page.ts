import { Page, Locator, expect } from "@playwright/test";

export class CreateGroupModal {
  readonly page: Page;

  // Modal container
  readonly modal: Locator;
  readonly modalTitle: Locator;

  // Form elements
  readonly form: Locator;
  readonly groupNameInput: Locator;
  readonly baseCurrencySelect: Locator;
  readonly inviteEmailsInput: Locator;

  // Action buttons
  readonly cancelButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Modal container and title - use data-testid for reliability
    this.modal = page.getByTestId("create-group-modal");
    this.modalTitle = page.getByTestId("create-group-modal-title");

    // Form elements
    this.form = page.getByTestId("create-group-form");
    this.groupNameInput = page.getByTestId("group-name-input");
    this.baseCurrencySelect = page.getByTestId("base-currency-select");
    this.inviteEmailsInput = page.getByTestId("invite-emails-input");

    // Action buttons
    this.cancelButton = page.getByTestId("cancel-create-group");
    this.submitButton = page.getByTestId("submit-create-group");
  }

  /**
   * Wait for modal to be visible and fully loaded
   */
  async waitForModal() {
    // Wait for modal content to be visible using the data-testid
    try {
      await this.modal.waitFor({ state: "visible", timeout: 10000 });
    } catch (_error) {
      // Fallback: try to find modal by role or text if data-testid fails
      console.log("Modal data-testid not found, trying fallback locator");
      const fallbackModal = this.page.getByRole("dialog").filter({ hasText: "Utwórz nową grupę" });
      await fallbackModal.waitFor({ state: "visible", timeout: 8000 });
    }

    // Wait for modal title to be visible
    await this.modalTitle.waitFor({ state: "visible", timeout: 8000 });

    // Wait a moment for all content to be fully rendered
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if modal is visible
   */
  async isModalVisible(): Promise<boolean> {
    return await this.modal.isVisible();
  }

  /**
   * Check if modal is hidden/closed
   */
  async isModalHidden(): Promise<boolean> {
    return await this.modal.isHidden();
  }

  /**
   * Fill group name input
   */
  async fillGroupName(name: string) {
    await this.groupNameInput.fill(name);
  }

  /**
   * Select base currency from dropdown
   */
  async selectBaseCurrency(currencyCode: string) {
    // Ensure the select trigger is visible and enabled
    await expect(this.baseCurrencySelect).toBeVisible();
    await expect(this.baseCurrencySelect).toBeEnabled();

    // Open the dropdown
    await this.baseCurrencySelect.click();

    // Wait for listbox to appear (Radix Select renders a listbox with options)
    const listbox = this.page.getByRole("listbox");
    await expect(listbox).toBeVisible();

    // Prefer selecting by value attribute for stability; fallback to text match
    const optionByValue = this.page.locator(`[role="option"][data-value="${currencyCode}"]`).first();
    if (await optionByValue.count()) {
      await optionByValue.click();
      return;
    }

    // Fallback: match by text beginning with the currency code (e.g., "PLN – ...")
    const optionByText = this.page.getByRole("option", { name: new RegExp(`^${currencyCode}\\b`) }).first();
    await optionByText.click();
  }

  /**
   * Add email invitation
   */
  async addEmailInvitation(email: string) {
    await this.inviteEmailsInput.fill(email);
    await this.inviteEmailsInput.press("Enter");
  }

  /**
   * Add multiple email invitations
   */
  async addEmailInvitations(emails: string[]) {
    for (const email of emails) {
      await this.addEmailInvitation(email);
    }
  }

  /**
   * Fill complete group creation form
   */
  async fillGroupForm(groupData: { name: string; currency?: string; emails?: string[] }) {
    await this.fillGroupName(groupData.name);

    if (groupData.currency) {
      await this.selectBaseCurrency(groupData.currency);
    }

    if (groupData.emails && groupData.emails.length > 0) {
      await this.addEmailInvitations(groupData.emails);
    }
  }

  /**
   * Click cancel button to close modal
   */
  async cancel() {
    await this.cancelButton.click();
    // Wait for modal to close
    await this.modal.waitFor({ state: "hidden", timeout: 5000 });
  }

  /**
   * Click submit button to create group
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Complete group creation flow
   */
  async createGroup(groupData: { name: string; currency?: string; emails?: string[] }) {
    await this.fillGroupForm(groupData);
    await this.submit();
  }

  /**
   * Check if submit button is disabled (during submission)
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Check if submit button is enabled
   */
  async isSubmitEnabled(): Promise<boolean> {
    return !(await this.isSubmitDisabled());
  }

  /**
   * Wait for submit button to be enabled (after form validation)
   */
  async waitForSubmitEnabled() {
    await this.submitButton.waitFor({ state: "visible" });
    await this.page.waitForFunction(() => {
      const button = document.querySelector('[data-testid="submit-create-group"]') as HTMLButtonElement;
      return button && !button.disabled;
    });
  }

  /**
   * Get current value of group name input
   */
  async getGroupNameValue(): Promise<string> {
    return await this.groupNameInput.inputValue();
  }

  /**
   * Get current value of base currency select
   */
  async getBaseCurrencyValue(): Promise<string> {
    // Get the displayed text directly from the select trigger
    const textContent = await this.baseCurrencySelect.textContent();

    // Extract currency code from text (e.g., "PLN — Polski Złoty" -> "PLN")
    const currencyCode = textContent?.split(" — ")[0]?.trim();
    return currencyCode || "";
  }

  /**
   * Get list of added email invitations
   */
  async getEmailInvitations(): Promise<string[]> {
    const chipTexts = this.page.locator('[data-testid="invite-email-chip-text"]');
    const emailTexts = await chipTexts.allTextContents();
    return emailTexts.map((email) => email.trim()).filter(Boolean);
  }
}
