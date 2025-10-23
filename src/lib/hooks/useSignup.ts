import { useState, useCallback } from "react";
import { createClient } from "@/db/supabase.client";
import { signupUser } from "@/lib/services/authService";
import { getAuthErrorMessage } from "@/lib/utils/authErrors";
import type { SignupFormData } from "@/lib/schemas/authSchemas";

interface UseSignupReturn {
  signup: (userData: SignupFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  reset: () => void;
}

/**
 * Custom hook for handling user signup logic
 *
 * Encapsulates the signup process including loading states,
 * error handling, and success state management.
 */
export function useSignup(): UseSignupReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const signup = useCallback(async (userData: SignupFormData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const supabase = createClient();
      await signupUser(supabase, userData);
      setIsSuccess(true);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setIsSuccess(false);
  }, []);

  return {
    signup,
    isLoading,
    error,
    isSuccess,
    reset,
  };
}
