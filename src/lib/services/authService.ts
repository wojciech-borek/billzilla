/**
 * Authentication service - handles business logic for authentication operations
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SignupFormData } from "../schemas/authSchemas";

/**
 * Custom error for signup failures
 */
export class SignupError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "SignupError";
  }
}

/**
 * Signs up a new user with Supabase Auth
 *
 * @param supabase - Supabase client instance
 * @param userData - User registration data
 * @returns Promise resolving when signup is successful
 * @throws SignupError if signup fails
 */
export async function signupUser(supabase: SupabaseClient, userData: SignupFormData): Promise<void> {
  try {
    const { error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
        },
      },
    });

    if (error) {
      throw new SignupError(`Rejestracja nie powiodła się: ${error.message}`, error);
    }
  } catch (error) {
    if (error instanceof SignupError) {
      throw error;
    }
    throw new SignupError("Wystąpił nieoczekiwany błąd podczas rejestracji", error);
  }
}
