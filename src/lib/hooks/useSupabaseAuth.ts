import { useMemo, useCallback } from "react";
import { createClient } from "@/db/supabase.client";

export function useSupabaseAuth() {
  const supabase = useMemo(() => createClient(), []);

  const signIn = useCallback(async (credentials: { email: string; password: string }) => {
    return await supabase.auth.signInWithPassword(credentials);
  }, [supabase.auth]);

  const signUp = useCallback(async (credentials: { email: string; password: string; options?: any }) => {
    return await supabase.auth.signUp(credentials);
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    return await supabase.auth.signOut();
  }, [supabase.auth]);

  const signInWithOAuth = useCallback(async (options: any) => {
    return await supabase.auth.signInWithOAuth(options);
  }, [supabase.auth]);

  const resetPassword = useCallback(async (email: string) => {
    // Use redirectTo to send recovery links to our recovery endpoint
    // This ensures users go to reset-password page, not auto-login to dashboard
    const redirectUrl = import.meta.env.DEV
      ? 'http://localhost:3000/auth/recovery'
      : `${window.location.origin}/auth/recovery`;
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
  }, [supabase.auth]);

  const updateUser = useCallback(async (attributes: any) => {
    return await supabase.auth.updateUser(attributes);
  }, [supabase.auth]);

  return {
    supabase,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updateUser,
  };
}
