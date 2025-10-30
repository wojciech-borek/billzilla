import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";
import { renderHook, type RenderHookResult } from "@testing-library/react";
import { usePasswordReset, type UsePasswordResetReturn } from "../../lib/hooks/usePasswordReset";
import { passwordResetService } from "../../lib/services/passwordResetService";
import { TEST_EMAIL } from "./testHelpers";
import { cleanupHook } from "./testHelpers";

// Mock passwordResetService
vi.mock("../../lib/services/passwordResetService", () => ({
  passwordResetService: {
    requestPasswordReset: vi.fn(),
  },
}));

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const setupHook = () => {
  const hook = renderHook(() => usePasswordReset());
  return hook;
};

const createMockService = () => vi.mocked(passwordResetService);

// =============================================================================
// FIXTURE FUNCTIONS
// =============================================================================

const createSuccessFixture = () => {
  const mockService = createMockService();
  mockService.requestPasswordReset.mockResolvedValue({ success: true });
  return mockService;
};

const createFailureFixture = (errorMessage: string | null = null) => {
  const mockService = createMockService();
  const response = errorMessage ? { success: false, error: errorMessage } : { success: false };
  mockService.requestPasswordReset.mockResolvedValue(response);
  return mockService;
};

const createExceptionFixture = () => {
  const mockService = createMockService();
  mockService.requestPasswordReset.mockImplementation(() => {
    throw new Error("Network error");
  });
  return mockService;
};

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

const expectInitialState = (hook: RenderHookResult<UsePasswordResetReturn, unknown>) => {
  expect(hook.result.current.isLoading).toBe(false);
  expect(hook.result.current.error).toBe(null);
  expect(hook.result.current.success).toBe(false);
};

const expectSuccessState = (hook: RenderHookResult<UsePasswordResetReturn, unknown>) => {
  expect(hook.result.current.success).toBe(true);
  expect(hook.result.current.error).toBe(null);
  expect(hook.result.current.isLoading).toBe(false);
};

const expectErrorState = (hook: RenderHookResult<UsePasswordResetReturn, unknown>, expectedError: string) => {
  expect(hook.result.current.success).toBe(false);
  expect(hook.result.current.error).toBe(expectedError);
  expect(hook.result.current.isLoading).toBe(false);
};

const expectLoadingState = (hook: RenderHookResult<UsePasswordResetReturn, unknown>, loading: boolean) => {
  expect(hook.result.current.isLoading).toBe(loading);
};

// =============================================================================
// EXECUTION HELPERS
// =============================================================================

const executeRequest = async (
  hook: RenderHookResult<UsePasswordResetReturn, unknown>,
  email: string = TEST_EMAIL
): Promise<boolean> => {
  let result: boolean;
  await act(async () => {
    result = await hook.result.current.requestReset(email);
  });
  return result;
};

describe("usePasswordReset", () => {
  let hook: RenderHookResult<UsePasswordResetReturn, unknown>;

  beforeEach(() => {
    hook = setupHook();
  });

  afterEach(() => {
    cleanupHook(hook);
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    describe("UT-USE-PASSWORD-RESET-001: should_initialize_with_default_states_when_hook_created", () => {
      it("should initialize with correct default state values", () => {
        // Arrange & Act - Hook is already set up in beforeEach

        // Assert
        expectInitialState(hook);
      });
    });
  });

  describe("Request Reset", () => {
    describe("Success Scenarios", () => {
      it("UT-USE-PASSWORD-RESET-002: should handle successful password reset", async () => {
        // Arrange
        const mockService = createSuccessFixture();

        // Act
        const result = await executeRequest(hook);

        // Assert
        expect(result).toBe(true);
        expectSuccessState(hook);
        expect(mockService.requestPasswordReset).toHaveBeenCalledWith(TEST_EMAIL);
        expect(mockService.requestPasswordReset).toHaveBeenCalledTimes(1);
      });
    });

    describe("Failure Scenarios", () => {
      it.each([
        {
          error: "Invalid email",
          expectedError: "Invalid email",
          testId: "UT-USE-PASSWORD-RESET-003",
        },
        {
          error: null,
          expectedError: "Wystąpił nieoczekiwany błąd",
          testId: "UT-USE-PASSWORD-RESET-004",
        },
      ])("$_testId: should handle password reset failure", async ({ error, expectedError, _testId }) => {
        // Arrange
        const mockService = createFailureFixture(error);

        // Act
        const result = await executeRequest(hook);

        // Assert
        expect(result).toBe(false);
        expectErrorState(hook, expectedError);
        expect(mockService.requestPasswordReset).toHaveBeenCalledWith(TEST_EMAIL);
        expect(mockService.requestPasswordReset).toHaveBeenCalledTimes(1);
      });
    });

    describe("Loading State", () => {
      describe("UT-USE-PASSWORD-RESET-005: should_manage_loading_state_during_request", () => {
        it("should set loading state during async operation and reset after completion", async () => {
          // Arrange
          createSuccessFixture();

          // Check initial state
          expectLoadingState(hook, false);

          // Act - Execute the request
          const result = await executeRequest(hook);

          // Assert - Loading should be back to false after completion
          expect(result).toBe(true);
          expectSuccessState(hook);
        });
      });
    });

    describe("Reset Functionality", () => {
      describe("UT-USE-PASSWORD-RESET-006: should_reset_all_states_when_reset_called", () => {
        it("should clear all states and return to initial values", async () => {
          // Arrange
          createFailureFixture("Test error");

          // Trigger a failed request to set error state
          await executeRequest(hook);

          // Verify error state is set
          expectErrorState(hook, "Test error");

          // Act - Call reset function
          act(() => {
            hook.result.current.reset();
          });

          // Assert - All states should be reset to initial values
          expectInitialState(hook);
        });
      });
    });

    describe("State Isolation Between Requests", () => {
      it.each([
        {
          firstRequest: { email: "invalid@example.com", success: false, error: "Invalid email" },
          secondRequest: { email: "valid@example.com", success: true, error: null },
          testId: "UT-USE-PASSWORD-RESET-007",
        },
        {
          firstRequest: { email: "valid@example.com", success: true, error: null },
          secondRequest: { email: "nonexistent@example.com", success: false, error: "Account not found" },
          testId: "UT-USE-PASSWORD-RESET-008",
        },
      ])(
        "$_testId: should clear previous state when new request starts",
        async ({ firstRequest, secondRequest, _testId }) => {
          // Arrange
          const mockService = createMockService();

          // First request
          mockService.requestPasswordReset.mockResolvedValueOnce({
            success: firstRequest.success,
            ...(firstRequest.error && { error: firstRequest.error }),
          });

          // Act & Assert - First request
          await executeRequest(hook, firstRequest.email);
          expect(hook.result.current.success).toBe(firstRequest.success);
          expect(hook.result.current.error).toBe(firstRequest.error);

          // Second request
          mockService.requestPasswordReset.mockResolvedValueOnce({
            success: secondRequest.success,
            ...(secondRequest.error && { error: secondRequest.error }),
          });

          // Act & Assert - Second request (should clear previous state)
          const result = await executeRequest(hook, secondRequest.email);
          expect(result).toBe(secondRequest.success);
          expect(hook.result.current.success).toBe(secondRequest.success);
          expect(hook.result.current.error).toBe(secondRequest.error);
        }
      );
    });

    describe("Exception Handling", () => {
      describe("UT-USE-PASSWORD-RESET-009: should_handle_service_throwing_exception", () => {
        it("should handle exceptions thrown by passwordResetService gracefully", async () => {
          // Arrange
          createExceptionFixture();

          // Act
          const result = await executeRequest(hook);

          // Assert
          expect(result).toBe(false);
          expectErrorState(hook, "Wystąpił nieoczekiwany błąd");
        });
      });
    });

    describe("Hook Instance Isolation", () => {
      describe("UT-USE-PASSWORD-RESET-010: should_maintain_state_isolation_between_multiple_hook_instances", () => {
        it("should maintain separate state for multiple hook instances", async () => {
          // Arrange
          const hook1 = renderHook(() => usePasswordReset());
          const hook2 = renderHook(() => usePasswordReset());

          const mockService = createMockService();

          // First hook succeeds
          mockService.requestPasswordReset.mockResolvedValueOnce({ success: true });

          // Second hook fails
          mockService.requestPasswordReset.mockResolvedValueOnce({ success: false, error: "User not found" });

          // Act
          const result1 = await executeRequest(hook1, "user1@example.com");
          const result2 = await executeRequest(hook2, "user2@example.com");

          // Assert
          expect(result1).toBe(true);
          expectSuccessState(hook1);

          expect(result2).toBe(false);
          expectErrorState(hook2, "User not found");

          // Cleanup
          hook1.unmount();
          hook2.unmount();
        });
      });
    });
  });
});
