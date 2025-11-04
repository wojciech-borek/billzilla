import type { ErrorResponseDTO } from "../../types";

/**
 * Custom error class for expense form operations
 */
export class ExpenseFormError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = "ExpenseFormError";
  }
}

/**
 * Handles HTTP errors from API responses
 * @param response - The fetch Response object
 * @param errorData - Parsed error data from response
 * @returns ExpenseFormError with appropriate message
 */
export const handleHttpError = (response: Response, errorData?: ErrorResponseDTO): ExpenseFormError => {
  if (response.status === 400 && errorData?.error.details) {
    // Field validation errors
    const fieldErrors = errorData.error.details as Record<string, string>;
    const firstField = Object.keys(fieldErrors)[0];
    return new ExpenseFormError(fieldErrors[firstField] || "Błąd walidacji danych", firstField);
  }

  const errorMessage =
    response.status === 401
      ? "Brak autoryzacji. Zaloguj się ponownie."
      : response.status === 404
        ? "Grupa nie została znaleziona lub nie jesteś jej uczestnikiem."
        : response.status === 500
          ? "Wystąpił błąd serwera. Spróbuj ponownie później."
          : "Nie udało się utworzyć wydatku";

  return new ExpenseFormError(errorMessage);
};

/**
 * Handles various types of errors and converts them to ExpenseFormError
 * @param error - The error to handle
 * @returns ExpenseFormError with appropriate message and field
 */
export const handleExpenseError = (error: unknown): ExpenseFormError => {
  if (error instanceof ExpenseFormError) {
    return error;
  }

  if (error instanceof Response) {
    // Handle HTTP response errors
    return error
      .json()
      .then((errorData: ErrorResponseDTO) => handleHttpError(error, errorData))
      .catch(() => new ExpenseFormError("Nie udało się przetworzyć odpowiedzi serwera"));
  }

  if (error instanceof Error) {
    // Handle standard JavaScript errors
    if (error.message === "Form validation failed") {
      return new ExpenseFormError("Wypełnij wszystkie wymagane pola poprawnie");
    }
    return new ExpenseFormError(error.message);
  }

  return new ExpenseFormError("Wystąpił nieznany błąd");
};

/**
 * Creates validation error for specific fields
 * @param field - Field name
 * @param message - Error message
 * @returns ExpenseFormError
 */
export const createFieldError = (field: string, message: string): ExpenseFormError => {
  return new ExpenseFormError(message, field);
};

/**
 * Type guard to check if error is ExpenseFormError
 * @param error - Error to check
 * @returns True if error is ExpenseFormError
 */
export const isExpenseFormError = (error: unknown): error is ExpenseFormError => {
  return error instanceof ExpenseFormError;
};
