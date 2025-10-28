/**
 * Custom error classes for expense service operations
 * Extends the existing error system used across the application
 */

/**
 * Custom error for expense validation failures
 * Used when input data doesn't meet business rules or format requirements
 */
export class ExpenseValidationError extends Error {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ExpenseValidationError";
  }
}

/**
 * Custom error for expense not found or access denied
 * Used when expense doesn't exist or user doesn't have permission to access it
 */
export class ExpenseAccessError extends Error {
  constructor(message = "Expense not found or you do not have permission to access it") {
    super(message);
    this.name = "ExpenseAccessError";
  }
}

/**
 * Custom error for expense transaction failures
 * Used when database operations in expense creation/update fail
 */
export class ExpenseTransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpenseTransactionError";
  }
}

/**
 * Custom error for expense data fetch failures
 * Used when database queries for expense data fail
 */
export class ExpenseDataError extends Error {
  constructor(operation: string, details?: string) {
    super(`Failed to ${operation}${details ? `: ${details}` : ""}`);
    this.name = "ExpenseDataError";
  }
}
