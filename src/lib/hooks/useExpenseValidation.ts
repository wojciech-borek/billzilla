import { useMemo } from "react";
import type { CreateExpenseFormValues } from "../../types";
import { validateExpenseFields, validateExpenseSplits } from "../utils/expenseValidationUtils";

export interface ExpenseValidationResult {
  fieldErrors: Record<string, string>;
  splitValidation: {
    totalAmount: number;
    currentSum: number;
    remaining: number;
    isValid: boolean;
  };
  isValid: boolean;
}

/**
 * Hook for reactive expense form validation
 * Provides validation results that update as form data changes
 *
 * @param formData - The current form data to validate
 * @returns Validation result with field errors and split validation
 */
export function useExpenseValidation(formData: CreateExpenseFormValues): ExpenseValidationResult {
  const validation = useMemo(() => {
    // Validate individual fields
    const fieldErrors = validateExpenseFields(formData);

    // Validate splits
    const splitValidation = validateExpenseSplits(formData.amount || 0, formData.splits || []);

    // Add split validation error to field errors if invalid
    if (!splitValidation.isValid && (formData.splits || []).length > 0) {
      const currentSum = isNaN(splitValidation.currentSum) ? 0 : splitValidation.currentSum;
      const totalAmount = isNaN(splitValidation.totalAmount) ? 0 : splitValidation.totalAmount;
      const remaining = isNaN(splitValidation.remaining) ? 0 : splitValidation.remaining;

      fieldErrors.splits = `Suma podziałów (${currentSum.toFixed(2)}) nie równa się kwocie całkowitej (${totalAmount.toFixed(2)}). Różnica: ${remaining > 0 ? "+" : ""}${remaining.toFixed(2)}`;
    }

    // Overall validity
    const isValid = Object.keys(fieldErrors).length === 0;

    return {
      fieldErrors,
      splitValidation,
      isValid,
    };
  }, [formData]);

  return validation;
}
