import { useMemo } from "react";
import { createClient } from "@/db/supabase.client";

export function useSupabaseAuth() {
  const supabase = useMemo(() => createClient(), []);

  return {
    supabase,
    signIn: supabase.auth.signInWithPassword,
    signUp: supabase.auth.signUp,
    signOut: supabase.auth.signOut,
    signInWithOAuth: supabase.auth.signInWithOAuth,
    resetPassword: supabase.auth.resetPasswordForEmail,
    updateUser: supabase.auth.updateUser,
  };
}
