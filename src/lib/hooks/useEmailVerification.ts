import { useState, useCallback } from "react";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { getAuthErrorMessage } from "@/lib/utils/authErrors";

type ConfirmationState = "verifying" | "success" | "error";

export function useEmailVerification(tokenHash: string, nextUrl?: string) {
  const [state, setState] = useState<ConfirmationState>("verifying");
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabaseAuth();

  const verifyEmail = useCallback(async () => {
    try {
      setState("verifying");
      setError(null);

      // Weryfikuj token
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      });

      if (error) {
        setError(getAuthErrorMessage(error));
        setState("error");
        return;
      }

      // Sukces - ustaw stan sukcesu
      setState("success");

      // Automatyczne przekierowanie po krótkiej chwili
      setTimeout(() => {
        window.location.assign(nextUrl || "/");
      }, 3000);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setState("error");
    }
  }, [tokenHash, nextUrl, supabase.auth]);

  return { state, error, verifyEmail };
}
