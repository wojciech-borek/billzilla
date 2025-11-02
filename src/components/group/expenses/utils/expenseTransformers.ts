import type { ExpenseDTO, CreateExpenseCommand } from "@/types";

/**
 * Transforms an ExpenseDTO to CreateExpenseCommand format for form initialization
 * This is used when editing existing expenses to populate the form
 */
export function transformExpenseToFormData(expense: ExpenseDTO): CreateExpenseCommand {
  return {
    description: expense.description,
    amount: expense.amount,
    currency_code: expense.currency_code,
    expense_date: new Date(expense.expense_date).toISOString().slice(0, 16),
    payer_id: expense.payer_id,
    splits: expense.splits.map((split) => ({
      profile_id: split.profile_id,
      amount: split.amount,
    })),
  };
}

/**
 * Validates that an expense object has all required fields for transformation
 */
export function isValidExpenseForForm(expense: Partial<ExpenseDTO>): expense is ExpenseDTO {
  return Boolean(
    expense.id &&
      expense.description &&
      typeof expense.amount === "number" &&
      expense.currency_code &&
      expense.expense_date &&
      expense.payer_id &&
      Array.isArray(expense.splits) &&
      expense.splits.length > 0
  );
}
