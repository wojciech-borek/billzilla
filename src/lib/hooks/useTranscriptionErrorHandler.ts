import { useCallback } from "react";
import { toast } from "sonner";
import type { TranscriptionErrorDTO } from "../../types";

/**
 * Error code to user-friendly message mapping
 */
const ERROR_MESSAGES: Record<string, string> = {
  MICROPHONE_ERROR: "Nie udało się uzyskać dostępu do mikrofonu",
  RECORDING_ERROR: "Błąd podczas nagrywania",
  RECORDING_TOO_SHORT: "Nagranie jest zbyt krótkie. Powiedz więcej szczegółów.",
  FILE_TOO_LARGE: "Nagranie jest zbyt duże. Maksymalny rozmiar: 25MB.",
  INVALID_REQUEST: "Nieprawidłowe dane nagrania",
  UNAUTHORIZED: "Brak autoryzacji",
  FORBIDDEN: "Brak dostępu do grupy",
  SERVICE_UNAVAILABLE: "Usługa transkrypcji jest tymczasowo niedostępna",
  UPLOAD_FAILED: "Nie udało się wysłać nagrania",
  POLLING_ERROR: "Błąd podczas sprawdzania statusu",
  TIMEOUT: "Przetwarzanie trwa zbyt długo. Spróbuj ponownie.",
  TRANSCRIPTION_FAILED: "Nie udało się przetworzyć nagrania",
  PARSING_FAILED: "Nie udało się zrozumieć treści nagrania",
  NETWORK_ERROR: "Błąd połączenia. Sprawdź internet.",
};

/**
 * Determine if an error is retryable
 */
const isRetryableError = (code: string): boolean => {
  const retryableCodes = [
    "NETWORK_ERROR",
    "SERVICE_UNAVAILABLE",
    "TIMEOUT",
    "POLLING_ERROR",
    "UPLOAD_FAILED",
  ];
  return retryableCodes.includes(code);
};

/**
 * Hook for handling transcription errors with consistent UI feedback
 *
 * Provides centralized error handling with user-friendly messages,
 * toast notifications, and retry logic determination.
 */
export function useTranscriptionErrorHandler() {
  /**
   * Get a user-friendly error message for an error code
   */
  const getErrorMessage = useCallback((error: TranscriptionErrorDTO): string => {
    return error.message || ERROR_MESSAGES[error.code] || "Wystąpił nieznany błąd";
  }, []);

  /**
   * Check if an error can be retried
   */
  const canRetry = useCallback((error: TranscriptionErrorDTO): boolean => {
    return isRetryableError(error.code);
  }, []);

  /**
   * Handle error with toast notification
   */
  const handleError = useCallback(
    (error: TranscriptionErrorDTO, options?: { showToast?: boolean }) => {
      const message = getErrorMessage(error);
      const retryable = canRetry(error);

      console.error("Transcription error:", {
        code: error.code,
        message,
        retryable,
      });

      // Show toast notification if requested (default: true)
      if (options?.showToast !== false) {
        if (retryable) {
          toast.error(message, {
            description: "Możesz spróbować ponownie",
            duration: 5000,
          });
        } else {
          toast.error(message, {
            duration: 4000,
          });
        }
      }

      return { message, retryable };
    },
    [getErrorMessage, canRetry]
  );

  /**
   * Create a standardized error object
   */
  const createError = useCallback(
    (code: string, customMessage?: string): TranscriptionErrorDTO => {
      return {
        code,
        message: customMessage || ERROR_MESSAGES[code] || "Wystąpił nieznany błąd",
      };
    },
    []
  );

  /**
   * Handle network/fetch errors and convert to TranscriptionErrorDTO
   */
  const handleNetworkError = useCallback(
    (error: unknown): TranscriptionErrorDTO => {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        return createError("NETWORK_ERROR", "Błąd połączenia. Sprawdź internet.");
      }

      if (error instanceof Error) {
        return createError("UPLOAD_FAILED", error.message);
      }

      return createError("UPLOAD_FAILED", "Nieznany błąd sieci");
    },
    [createError]
  );

  /**
   * Handle HTTP response errors and convert to TranscriptionErrorDTO
   */
  const handleHttpError = useCallback(
    (status: number): TranscriptionErrorDTO => {
      switch (status) {
        case 400:
          return createError("INVALID_REQUEST");
        case 401:
          return createError("UNAUTHORIZED");
        case 403:
          return createError("FORBIDDEN");
        case 413:
          return createError("FILE_TOO_LARGE");
        case 503:
          return createError("SERVICE_UNAVAILABLE");
        default:
          return createError("UPLOAD_FAILED", `Błąd serwera (${status})`);
      }
    },
    [createError]
  );

  return {
    getErrorMessage,
    canRetry,
    handleError,
    createError,
    handleNetworkError,
    handleHttpError,
  };
}

