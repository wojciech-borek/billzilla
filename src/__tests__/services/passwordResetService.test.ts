import { describe, it, expect, vi, beforeEach } from "vitest";
import { PasswordResetService } from "../../lib/services/passwordResetService";
import { createMockAuthSupabaseClient } from "./testHelpers";
import type { MockSupabaseClient } from "../testTypes";
import type { User } from "@/types";

// Mock createClient to avoid Supabase environment requirements
vi.mock("../../db/supabase.client", () => ({
  createClient: vi.fn(),
}));

// Mock getAuthErrorMessage to control error message processing
vi.mock("../../lib/utils/authErrors", () => ({
  getAuthErrorMessage: vi.fn(),
}));

// Import after mocking
import { createClient } from "../../db/supabase.client";
import { getAuthErrorMessage } from "../../lib/utils/authErrors";

// Mock Supabase client
let mockSupabaseClient: MockSupabaseClient;

beforeEach(() => {
  mockSupabaseClient = createMockAuthSupabaseClient({
    setSession: {
      data: {
        user: null,
        session: {
          access_token: "token",
          refresh_token: "refresh",
          token_type: "bearer",
          expires_in: 3600,
          user: {} as User,
        },
      },
      error: null,
    },
    verifyOtp: { data: { user: null, session: null }, error: null },
    updateUser: { data: { user: {} as User, session: null }, error: null },
    signOut: { error: null },
    resetPasswordForEmail: { error: null },
  });

  // Mock createClient to return our mock client
  vi.mocked(createClient).mockReturnValue(mockSupabaseClient);

  // Clear all mocks before each test
  vi.clearAllMocks();
});

// Helper to create service instance with mocked supabase
const createMockedService = () => {
  return new PasswordResetService();
};

describe("PasswordResetService", () => {
  describe("validateAndEstablishSession", () => {
    describe("UT-PRS-VAES-001: should_return_success_when_valid_session_tokens_provided", () => {
      it("should return success when valid session tokens are provided", async () => {
        // Arrange
        const service = createMockedService();
        const tokens = { accessToken: "valid_access_token", refreshToken: "valid_refresh_token" };

        vi.mocked(mockSupabaseClient.auth.setSession).mockResolvedValue({
          data: {
            user: null,
            session: {
              access_token: "token",
              refresh_token: "refresh",
              token_type: "bearer",
              expires_in: 3600,
              user: {} as User,
            },
          },
          error: null,
        });

        // Act
        const result = await service.validateAndEstablishSession(tokens);

        // Assert
        expect(result).toEqual({ success: true });
        expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });
        expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledTimes(1);
      });
    });

    describe("UT-PRS-VAES-002: should_return_error_when_setSession_fails", () => {
      it("should return error when setSession fails", async () => {
        // Arrange
        const service = createMockedService();
        const tokens = { accessToken: "invalid_access_token", refreshToken: "invalid_refresh_token" };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authError = { message: "Invalid tokens", code: "invalid_token" } as any;
        const expectedErrorMessage = "Przetworzona wiadomość błędu";

        vi.mocked(mockSupabaseClient.auth.setSession).mockResolvedValue({
          data: { user: null, session: null },
          error: authError,
        });
        vi.mocked(getAuthErrorMessage).mockReturnValue(expectedErrorMessage);

        // Act
        const result = await service.validateAndEstablishSession(tokens);

        // Assert
        expect(result).toEqual({ success: false, error: expectedErrorMessage });
        expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });
        expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledTimes(1);
        expect(getAuthErrorMessage).toHaveBeenCalledWith(authError);
      });
    });

    describe("UT-PRS-VAES-003: should_return_error_when_no_valid_token_provided", () => {
      it("should return error when no valid token is provided", async () => {
        // Arrange
        const service = createMockedService();
        const tokens = {}; // Empty object with no tokens

        // Act
        const result = await service.validateAndEstablishSession(tokens);

        // Assert
        expect(result).toEqual({
          success: false,
          error: "Brak prawidłowego tokenu resetowania hasła",
        });
        // Verify that no Supabase methods were called since validation failed early
        expect(mockSupabaseClient.auth.setSession).not.toHaveBeenCalled();
        expect(mockSupabaseClient.auth.verifyOtp).not.toHaveBeenCalled();
      });
    });

    describe("UT-PRS-VAES-004: should_verify_pkce_token_successfully", () => {
      it("should verify PKCE token successfully", async () => {
        // Arrange
        const service = createMockedService();
        const tokens = { token: "pkce_valid_token_hash" };

        vi.mocked(mockSupabaseClient.auth.verifyOtp).mockResolvedValue({
          data: { user: null, session: null, messageId: undefined },
          error: null,
        });

        // Act
        const result = await service.validateAndEstablishSession(tokens);

        // Assert
        expect(result).toEqual({ success: true });
        expect(mockSupabaseClient.auth.verifyOtp).toHaveBeenCalledWith({
          token_hash: "pkce_valid_token_hash",
          type: "recovery",
        });
        expect(mockSupabaseClient.auth.verifyOtp).toHaveBeenCalledTimes(1);
        expect(mockSupabaseClient.auth.setSession).not.toHaveBeenCalled();
      });
    });

    describe("UT-PRS-VAES-005: should_verify_regular_token_successfully", () => {
      it("should verify regular token successfully", async () => {
        // Arrange
        const service = createMockedService();
        const tokens = { tokenHash: "regular_token_hash" };

        vi.mocked(mockSupabaseClient.auth.verifyOtp).mockResolvedValue({
          data: { user: null, session: null, messageId: undefined },
          error: null,
        });

        // Act
        const result = await service.validateAndEstablishSession(tokens);

        // Assert
        expect(result).toEqual({ success: true });
        expect(mockSupabaseClient.auth.verifyOtp).toHaveBeenCalledWith({
          token_hash: "regular_token_hash",
          type: "recovery",
        });
        expect(mockSupabaseClient.auth.verifyOtp).toHaveBeenCalledTimes(1);
        expect(mockSupabaseClient.auth.setSession).not.toHaveBeenCalled();
      });
    });

    describe("UT-PRS-VAES-006: should_return_error_when_verifyOtp_fails", () => {
      it("should return error when verifyOtp fails", async () => {
        // Arrange
        const service = createMockedService();
        const tokens = { token: "invalid_token_hash" };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authError = { message: "Invalid token", code: "invalid_token" } as any;
        const expectedErrorMessage = "Przetworzona wiadomość błędu";

        vi.mocked(mockSupabaseClient.auth.verifyOtp).mockResolvedValue({
          data: { user: null, session: null, messageId: undefined },
          error: authError,
        });
        vi.mocked(getAuthErrorMessage).mockReturnValue(expectedErrorMessage);

        // Act
        const result = await service.validateAndEstablishSession(tokens);

        // Assert
        expect(result).toEqual({ success: false, error: expectedErrorMessage });
        expect(mockSupabaseClient.auth.verifyOtp).toHaveBeenCalledWith({
          token_hash: "invalid_token_hash",
          type: "recovery",
        });
        expect(mockSupabaseClient.auth.verifyOtp).toHaveBeenCalledTimes(1);
        expect(getAuthErrorMessage).toHaveBeenCalledWith(authError);
        expect(mockSupabaseClient.auth.setSession).not.toHaveBeenCalled();
      });
    });

    describe("UT-PRS-VAES-007: should_handle_unexpected_exception", () => {
      it("should handle unexpected exception", async () => {
        // Arrange
        const service = createMockedService();
        const tokens = { accessToken: "any_token", refreshToken: "any_token" };
        const unexpectedError = new Error("Network error");
        const expectedErrorMessage = "Przetworzona wiadomość błędu";

        vi.mocked(mockSupabaseClient.auth.setSession).mockRejectedValue(unexpectedError);
        vi.mocked(getAuthErrorMessage).mockReturnValue(expectedErrorMessage);

        // Act
        const result = await service.validateAndEstablishSession(tokens);

        // Assert
        expect(result).toEqual({ success: false, error: expectedErrorMessage });
        expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith({
          access_token: "any_token",
          refresh_token: "any_token",
        });
        expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledTimes(1);
        expect(getAuthErrorMessage).toHaveBeenCalledWith(unexpectedError);
      });
    });
  });

  describe("updatePassword", () => {
    describe("UT-PRS-UP-001: should_update_password_and_sign_out_successfully", () => {
      it("should update password and sign out successfully", async () => {
        // Arrange
        const service = createMockedService();
        const newPassword = "ValidPassword123!";

        vi.mocked(mockSupabaseClient.auth.updateUser).mockResolvedValue({
          data: { user: { id: "test-user-id" } as User, session: null },
          error: null,
        });
        vi.mocked(mockSupabaseClient.auth.signOut).mockResolvedValue({
          error: null,
        });

        // Act
        const result = await service.updatePassword(newPassword);

        // Assert
        expect(result).toEqual({ success: true });
        expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
          password: newPassword,
        });
        expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledTimes(1);
        expect(mockSupabaseClient.auth.signOut).toHaveBeenCalledTimes(1);
      });
    });

    describe("UT-PRS-UP-002: should_return_error_when_updateUser_fails", () => {
      it("should return error when updateUser fails", async () => {
        // Arrange
        const service = createMockedService();
        const newPassword = "weak_password";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authError = { message: "Password policy violation", code: "weak_password" } as any;
        const expectedErrorMessage = "Przetworzona wiadomość błędu";

        vi.mocked(mockSupabaseClient.auth.updateUser).mockResolvedValue({
          data: { user: null, session: null },
          error: authError,
        });
        vi.mocked(getAuthErrorMessage).mockReturnValue(expectedErrorMessage);

        // Act
        const result = await service.updatePassword(newPassword);

        // Assert
        expect(result).toEqual({ success: false, error: expectedErrorMessage });
        expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
          password: newPassword,
        });
        expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledTimes(1);
        expect(mockSupabaseClient.auth.signOut).not.toHaveBeenCalled();
        expect(getAuthErrorMessage).toHaveBeenCalledWith(authError);
      });
    });

    describe("UT-PRS-UP-003: should_handle_exception_during_signOut", () => {
      it("should handle exception during signOut", async () => {
        // Arrange
        const service = createMockedService();
        const newPassword = "ValidPassword123!";

        vi.mocked(mockSupabaseClient.auth.updateUser).mockResolvedValue({
          data: { user: { id: "test-user-id" } as User, session: null },
          error: null,
        });
        vi.mocked(mockSupabaseClient.auth.signOut).mockRejectedValue(new Error("Sign out failed"));

        // Act
        const result = await service.updatePassword(newPassword);

        // Assert
        expect(result).toEqual({ success: true });
        expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
          password: newPassword,
        });
        expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledTimes(1);
        expect(mockSupabaseClient.auth.signOut).toHaveBeenCalledTimes(1);
      });
    });

    describe("UT-PRS-UP-004: should_handle_unexpected_exception", () => {
      it("should handle unexpected exception", async () => {
        // Arrange
        const service = createMockedService();
        const newPassword = "ValidPassword123!";
        const unexpectedError = new Error("Network error");
        const expectedErrorMessage = "Przetworzona wiadomość błędu";

        vi.mocked(mockSupabaseClient.auth.updateUser).mockRejectedValue(unexpectedError);
        vi.mocked(getAuthErrorMessage).mockReturnValue(expectedErrorMessage);

        // Act
        const result = await service.updatePassword(newPassword);

        // Assert
        expect(result).toEqual({ success: false, error: expectedErrorMessage });
        expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
          password: newPassword,
        });
        expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledTimes(1);
        expect(mockSupabaseClient.auth.signOut).not.toHaveBeenCalled();
        expect(getAuthErrorMessage).toHaveBeenCalledWith(unexpectedError);
      });
    });
  });

  describe("requestPasswordReset", () => {
    const originalWindow = global.window;

    beforeEach(() => {
      // Mock window.location for production environment tests
      global.window = {
        location: {
          origin: "https://app.example.com",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    });

    afterEach(() => {
      // Restore original window
      global.window = originalWindow;
    });

    describe("UT-PRS-RPR-001: should_request_reset_in_development_environment", () => {
      it("should request reset in development environment", async () => {
        // Arrange
        const service = createMockedService();
        const email = "user@example.com";

        // Mock development environment
        const originalDev = import.meta.env.DEV;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (import.meta.env as any).DEV = true;

        vi.mocked(mockSupabaseClient.auth.resetPasswordForEmail).mockResolvedValue({
          error: null,
        });

        // Act
        const result = await service.requestPasswordReset(email);

        // Assert
        expect(result).toEqual({ success: true });
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
          redirectTo: "http://localhost:3000/auth/recovery",
        });
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);

        // Restore original value
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (import.meta.env as any).DEV = originalDev;
      });
    });

    describe("UT-PRS-RPR-002: should_request_reset_in_production_environment", () => {
      it("should request reset in production environment", async () => {
        // Arrange
        const service = createMockedService();
        const email = "user@example.com";

        // Mock production environment by directly modifying import.meta.env
        const originalDev = import.meta.env.DEV;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (import.meta.env as any).DEV = false;

        vi.mocked(mockSupabaseClient.auth.resetPasswordForEmail).mockResolvedValue({
          error: null,
        });

        // Act
        const result = await service.requestPasswordReset(email);

        // Assert
        expect(result).toEqual({ success: true });
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
          redirectTo: "https://app.example.com/auth/recovery",
        });
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);

        // Restore original value
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (import.meta.env as any).DEV = originalDev;
      });
    });

    describe("UT-PRS-RPR-003: should_return_error_when_resetPasswordForEmail_fails", () => {
      it("should return error when resetPasswordForEmail fails", async () => {
        // Arrange
        const service = createMockedService();
        const email = "invalid@example.com";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authError = { message: "User not found", code: "user_not_found" } as any;
        const expectedErrorMessage = "Przetworzona wiadomość błędu";

        // Mock development environment for simplicity
        const originalDev = import.meta.env.DEV;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (import.meta.env as any).DEV = true;

        vi.mocked(mockSupabaseClient.auth.resetPasswordForEmail).mockResolvedValue({
          error: authError,
        });
        vi.mocked(getAuthErrorMessage).mockReturnValue(expectedErrorMessage);

        // Act
        const result = await service.requestPasswordReset(email);

        // Assert
        expect(result).toEqual({ success: false, error: expectedErrorMessage });
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
          redirectTo: "http://localhost:3000/auth/recovery",
        });
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
        expect(getAuthErrorMessage).toHaveBeenCalledWith(authError);

        // Restore original value
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (import.meta.env as any).DEV = originalDev;
      });
    });

    describe("UT-PRS-RPR-004: should_handle_unexpected_exception", () => {
      it("should handle unexpected exception", async () => {
        // Arrange
        const service = createMockedService();
        const email = "user@example.com";
        const unexpectedError = new Error("Network error");
        const expectedErrorMessage = "Przetworzona wiadomość błędu";

        // Mock development environment
        const originalDev = import.meta.env.DEV;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (import.meta.env as any).DEV = true;

        vi.mocked(mockSupabaseClient.auth.resetPasswordForEmail).mockRejectedValue(unexpectedError);
        vi.mocked(getAuthErrorMessage).mockReturnValue(expectedErrorMessage);

        // Act
        const result = await service.requestPasswordReset(email);

        // Assert
        expect(result).toEqual({ success: false, error: expectedErrorMessage });
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
          redirectTo: "http://localhost:3000/auth/recovery",
        });
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
        expect(getAuthErrorMessage).toHaveBeenCalledWith(unexpectedError);

        // Restore original value
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (import.meta.env as any).DEV = originalDev;
      });
    });

    describe("UT-PRS-RPR-005: should_validate_email_parameter", () => {
      it("should validate email parameter", async () => {
        // Arrange
        const service = createMockedService();
        const email = "test@domain.com";

        // Mock development environment
        const originalDev = import.meta.env.DEV;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (import.meta.env as any).DEV = true;

        vi.mocked(mockSupabaseClient.auth.resetPasswordForEmail).mockResolvedValue({
          error: null,
        });

        // Act
        const result = await service.requestPasswordReset(email);

        // Assert
        expect(result).toEqual({ success: true });
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
          redirectTo: "http://localhost:3000/auth/recovery",
        });
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);

        // Restore original value
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (import.meta.env as any).DEV = originalDev;
      });
    });
  });
});
