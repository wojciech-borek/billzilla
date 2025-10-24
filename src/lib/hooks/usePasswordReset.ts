import { useState, useCallback } from "react";
import { passwordResetService } from "@/lib/services/passwordResetService";

interface UsePasswordResetReturn {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  requestReset: (email: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Hook do obsługi żądania resetowania hasła
 * Używa PasswordResetService dla centralizacji logiki i bezpieczeństwa
 */
export function usePasswordReset(): UsePasswordResetReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const requestReset = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await passwordResetService.requestPasswordReset(email);

      if (result.success) {
        setSuccess(true);
        return true;
      } else {
        setError(result.error || "Wystąpił nieoczekiwany błąd");
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    isLoading,
    error,
    success,
    requestReset,
    reset,
  };
}
