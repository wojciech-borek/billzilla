import type { CreateExpenseFormValues, Split } from "../../types";

/**
 * Validates individual expense form fields
 * @param formData - The form data to validate
 * @returns Object with field errors, empty if no errors
 */
export const validateExpenseFields = (formData: CreateExpenseFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!formData.description?.trim()) {
    errors.description = "Opis wydatku jest wymagany";
  }

  if (!formData.amount || formData.amount <= 0) {
    errors.amount = "Kwota musi być większa od zera";
  }

  if (!formData.currency_code) {
    errors.currency_code = "Wybierz walutę";
  }

  if (!formData.expense_date) {
    errors.expense_date = "Data wydatku jest wymagana";
  }

  if (!formData.payer_id) {
    errors.payer_id = "Wybierz płatnika";
  }

  if (!formData.splits || formData.splits.length === 0) {
    errors.splits = "Przynajmniej jeden uczestnik musi mieć przypisaną kwotę";
  }

  return errors;
};

/**
 * Validates expense splits to ensure they sum up to the total amount
 * @param totalAmount - The total expense amount
 * @param splits - Array of expense splits
 * @returns Validation result with current sum, remaining amount, and validity status
 */
export const validateExpenseSplits = (totalAmount: number, splits: Split[]) => {
  const currentSum = splits.reduce((sum, split) => sum + split.amount, 0);
  const remaining = Math.round((totalAmount - currentSum) * 100) / 100;
  const isValid = Math.abs(remaining) <= 0.01; // ±0.01 tolerance

  return {
    currentSum,
    remaining,
    isValid,
  };
};

/**
 * Validates transcription data before populating the form
 * @param data - Transcription result data
 * @returns Validation errors, empty if valid
 */
export const validateTranscriptionData = (data: {
  description?: string;
  amount?: number;
  splits?: Split[];
}): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.description?.trim()) {
    errors.description = "Brak opisu w danych z transkrypcji";
  }

  if (!data.amount || data.amount <= 0) {
    errors.amount = "Nieprawidłowa kwota w danych z transkrypcji";
  }

  if (!data.splits || data.splits.length === 0) {
    errors.splits = "Brak podziału kosztów w danych z transkrypcji";
  }

  return errors;
};

/**
 * Filters splits to only include those with amounts > 0
 * @param splits - Array of splits to filter
 * @returns Filtered splits array
 */
export const filterValidSplits = (splits: Split[]): Split[] => {
  return splits.filter((split) => split.amount > 0);
};
