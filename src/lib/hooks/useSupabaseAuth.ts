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
    return await supabase.auth.resetPasswordForEmail(email);
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
