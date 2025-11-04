import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthError } from "@/types";
import { SignupError, signupUser } from "../../lib/services/authService";
import type { SignupFormData } from "../../lib/schemas/authSchemas";
import { createMockAuthSupabaseClient, type MockSupabaseClient } from "./testHelpers";

describe("SignupError", () => {
  describe("UT-authService-01: should_create_error_with_message_and_original_error_when_constructed", () => {
    it("should create error with message and originalError properties", () => {
      // Arrange
      const message = "Test error message";
      const originalError = new Error("Original error");

      // Act
      const error = new SignupError(message, originalError);

      // Assert
      expect(error.message).toBe(message);
      expect(error.name).toBe("SignupError");
      expect(error.originalError).toBe(originalError);
    });
  });

  describe("UT-authService-02: should_create_error_with_only_message_when_no_original_error", () => {
    it("should create error with message and name, originalError undefined", () => {
      // Arrange
      const message = "Simple error message";

      // Act
      const error = new SignupError(message);

      // Assert
      expect(error.message).toBe(message);
      expect(error.name).toBe("SignupError");
      expect(error.originalError).toBeUndefined();
    });
  });
});

describe("signupUser", () => {
  let mockSupabaseClient: MockSupabaseClient;

  beforeEach(() => {
    mockSupabaseClient = createMockAuthSupabaseClient();
  });

  describe("UT-authService-03: should_signup_successfully_when_supabase_signup_succeeds", () => {
    it("should complete without throwing when Supabase signup succeeds", async () => {
      // Arrange
      const userData: SignupFormData = {
        email: "test@example.com",
        password: "password123",
        full_name: "John Doe",
        confirm_password: "password123",
      };

      vi.mocked(mockSupabaseClient.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      // Act & Assert
      await expect(signupUser(mockSupabaseClient, userData)).resolves.not.toThrow();

      // Verify signUp was called with correct parameters
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
          },
        },
      });
    });
  });

  describe("UT-authService-04: should_throw_signup_error_when_supabase_returns_error", () => {
    it("should throw SignupError with correct message and original error when Supabase returns error", async () => {
      // Arrange
      const userData: SignupFormData = {
        email: "test@example.com",
        password: "password123",
        full_name: "John Doe",
        confirm_password: "password123",
      };

      const supabaseError = {
        message: "User already registered",
        code: "user_already_registered",
        status: 400,
        name: "AuthError",
      } as AuthError;
      vi.mocked(mockSupabaseClient.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: supabaseError,
      });

      // Act & Assert
      await expect(signupUser(mockSupabaseClient, userData)).rejects.toThrow(SignupError);

      try {
        await signupUser(mockSupabaseClient, userData);
      } catch (error) {
        expect(error).toBeInstanceOf(SignupError);
        expect((error as SignupError).message).toBe("Rejestracja nie powiodła się: User already registered");
        expect((error as SignupError).originalError).toBe(supabaseError);
      }
    });
  });

  describe("UT-authService-05: should_throw_signup_error_when_unexpected_error_occurs", () => {
    it("should throw SignupError with generic message when unexpected error occurs", async () => {
      // Arrange
      const userData: SignupFormData = {
        email: "test@example.com",
        password: "password123",
        full_name: "John Doe",
        confirm_password: "password123",
      };

      const unexpectedError = new Error("Network error");
      vi.mocked(mockSupabaseClient.auth.signUp).mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(signupUser(mockSupabaseClient, userData)).rejects.toThrow(SignupError);

      try {
        await signupUser(mockSupabaseClient, userData);
      } catch (error) {
        expect(error).toBeInstanceOf(SignupError);
        expect((error as SignupError).message).toBe("Wystąpił nieoczekiwany błąd podczas rejestracji");
        expect((error as SignupError).originalError).toBe(unexpectedError);
      }
    });
  });

  describe("UT-authService-06: should_pass_user_metadata_correctly_to_supabase", () => {
    it("should pass full_name in user metadata to Supabase signUp options", async () => {
      // Arrange
      const userData: SignupFormData = {
        email: "test@example.com",
        password: "password123",
        full_name: "Test User",
        confirm_password: "password123",
      };

      vi.mocked(mockSupabaseClient.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      // Act
      await signupUser(mockSupabaseClient, userData);

      // Assert
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
          },
        },
      });
    });
  });

  describe("UT-authService-07: should_rethrow_existing_signup_error_without_wrapping", () => {
    it("should rethrow existing SignupError instance without additional wrapping", async () => {
      // Arrange
      const userData: SignupFormData = {
        email: "test@example.com",
        password: "password123",
        full_name: "John Doe",
        confirm_password: "password123",
      };

      const existingSignupError = new SignupError("Existing error message", new Error("Original"));
      vi.mocked(mockSupabaseClient.auth.signUp).mockRejectedValue(existingSignupError);

      // Act & Assert
      await expect(signupUser(mockSupabaseClient, userData)).rejects.toThrow(existingSignupError);

      try {
        await signupUser(mockSupabaseClient, userData);
      } catch (error) {
        expect(error).toBe(existingSignupError); // Same instance, not wrapped
        expect(error).toBeInstanceOf(SignupError);
        expect((error as SignupError).message).toBe("Existing error message");
        expect((error as SignupError).originalError).toBeInstanceOf(Error);
      }
    });
  });
});
