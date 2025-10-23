import { useState, useCallback } from "react";
import { useSupabaseAuth } from "./useSupabaseAuth";

/**
 * Hook do obsługi wylogowania użytkownika
 * Centralizuje logikę wylogowania aby uniknąć duplikacji
 */
export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { supabase } = useSupabaseAuth();

  const logout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Błąd podczas wylogowania:", error);
        setIsLoggingOut(false);
        return { success: false, error };
      }

      // Przekierowanie na stronę logowania
      window.location.href = "/login";
      return { success: true, error: null };
    } catch (err) {
      console.error("Nieoczekiwany błąd podczas wylogowania:", err);
      setIsLoggingOut(false);
      return { success: false, error: err };
    }
  }, [supabase]);

  return {
    logout,
    isLoggingOut,
  };
}
