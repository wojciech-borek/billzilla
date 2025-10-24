/**
 * Password Reset Service
 *
 * Centralizes password reset logic, token validation, and security measures.
 * This service handles the complex token verification flow and provides
 * a clean interface for password reset operations.
 */

import { createClient } from "@/db/supabase.client";
import { getAuthErrorMessage } from "@/lib/utils/authErrors";

export interface PasswordResetTokens {
  token?: string;
  tokenHash?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

/**
 * Validates and processes password reset tokens
 * Handles different token types: PKCE, hosted session, and direct tokens
 */
export class PasswordResetService {
  private supabase = createClient();

  /**
   * Validates password reset token and establishes session if needed
   */
  async validateAndEstablishSession(tokens: PasswordResetTokens): Promise<PasswordResetResult> {
    try {
      // Priority 1: Session tokens from hosted Supabase flow
      if (tokens.accessToken && tokens.refreshToken) {
        const { error } = await this.supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });

        if (error) {
          return { success: false, error: getAuthErrorMessage(error) };
        }

        return { success: true };
      }

      // Priority 2: Direct token verification
      const authToken = tokens.token || tokens.tokenHash;
      if (!authToken) {
        return { success: false, error: "Brak prawidłowego tokenu resetowania hasła" };
      }

      // Handle PKCE tokens (from direct Supabase verify links)
      if (tokens.token?.startsWith('pkce_')) {
        const { error } = await this.supabase.auth.verifyOtp({
          token_hash: authToken,
          type: "recovery",
        });

        if (error) {
          return { success: false, error: getAuthErrorMessage(error) };
        }

        return { success: true };
      }

      // Handle regular token_hash verification
      const { error } = await this.supabase.auth.verifyOtp({
        token_hash: authToken,
        type: "recovery",
      });

      if (error) {
        return { success: false, error: getAuthErrorMessage(error) };
      }

      return { success: true };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("PasswordResetService: validation error:", err);
      }
      return { success: false, error: getAuthErrorMessage(err) };
    }
  }

  /**
   * Updates user password and handles post-password-change operations
   */
  async updatePassword(newPassword: string): Promise<PasswordResetResult> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: getAuthErrorMessage(error) };
      }

      // Sign out user after password change for security
      await this.supabase.auth.signOut();

      return { success: true };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("PasswordResetService: password update error:", err);
      }
      return { success: false, error: getAuthErrorMessage(err) };
    }
  }

  /**
   * Initiates password reset request
   */
  async requestPasswordReset(email: string): Promise<PasswordResetResult> {
    try {
      // Generate proper redirect URL
      const redirectUrl = import.meta.env.DEV
        ? 'http://localhost:3000/auth/recovery'
        : `${window.location.origin}/auth/recovery`;

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: getAuthErrorMessage(error) };
      }

      return { success: true };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("PasswordResetService: request error:", err);
      }
      return { success: false, error: getAuthErrorMessage(err) };
    }
  }
}

// Export singleton instance
export const passwordResetService = new PasswordResetService();
