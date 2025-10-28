/**
 * Custom error classes for group service operations
 */

/**
 * Custom error for currency not found
 */
export class CurrencyNotFoundError extends Error {
  constructor(currencyCode: string) {
    super(`Currency with code '${currencyCode}' does not exist`);
    this.name = "CurrencyNotFoundError";
  }
}

/**
 * Custom error for transaction failures
 */
export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionError";
  }
}

/**
 * Custom error for group not found or access denied
 */
export class GroupAccessError extends Error {
  constructor(message = "Group not found or you are not a member") {
    super(message);
    this.name = "GroupAccessError";
  }
}

/**
 * Custom error for group data fetch failures
 */
export class GroupDataError extends Error {
  constructor(operation: string, details?: string) {
    super(`Failed to ${operation}${details ? `: ${details}` : ""}`);
    this.name = "GroupDataError";
  }
}
