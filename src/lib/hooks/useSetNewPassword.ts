import { useState, useCallback } from "react";
import { passwordResetService, type PasswordResetTokens } from "@/lib/services/passwordResetService";

interface UseSetNewPasswordParams {
  token?: string;
  tokenHash?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface UseSetNewPasswordReturn {
  isLoading: boolean;
  error: string | null;
  setNewPassword: (password: string) => Promise<boolean>;
}

/**
 * Hook do obsługi ustawiania nowego hasła po resetowaniu
 * Używa PasswordResetService dla centralizacji logiki i bezpieczeństwa
 */
export function useSetNewPassword({
  token,
  tokenHash,
  accessToken,
  refreshToken,
}: UseSetNewPasswordParams): UseSetNewPasswordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setNewPassword = useCallback(async (password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate tokens and establish session
      const tokens: PasswordResetTokens = { token, tokenHash, accessToken, refreshToken };
      const validationResult = await passwordResetService.validateAndEstablishSession(tokens);

      if (!validationResult.success) {
        setError(validationResult.error || "Błąd walidacji tokenu");
        return false;
      }

      // Update password
      const updateResult = await passwordResetService.updatePassword(password);

      if (!updateResult.success) {
        setError(updateResult.error || "Błąd zmiany hasła");
        return false;
      }

      // Redirect to login with success message
      window.location.href = '/login?success=password_changed';
      return true;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("useSetNewPassword: unexpected error:", err);
      }
      setError("Wystąpił nieoczekiwany błąd");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, tokenHash, accessToken, refreshToken]);

  return {
    isLoading,
    error,
    setNewPassword,
  };
}
