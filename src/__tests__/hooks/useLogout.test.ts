import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { AuthError } from "@supabase/supabase-js";
import { useLogout } from "../../lib/hooks/useLogout";
import {
  createLogoutTestFixture,
  createMockAuthSupabaseClient,
  createMockUseSupabaseAuth,
} from "../services/testHelpers";

// Mock useSupabaseAuth at the module level following Vitest guidelines
vi.mock("../../lib/hooks/useSupabaseAuth", () => ({
  useSupabaseAuth: vi.fn(),
}));

// Import the mocked hook for use in tests
import { useSupabaseAuth } from "../../lib/hooks/useSupabaseAuth";

describe("useLogout", () => {
  const { setupWindowLocation, renderHookAndLogout } = createLogoutTestFixture();

  beforeEach(() => {
    vi.clearAllMocks();
    setupWindowLocation();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("UT-USELOGOUT-001: should_return_success_and_redirect_when_signOut_succeeds", () => {
    it("should return success and redirect when signOut succeeds", async () => {
      const { logoutResult } = await renderHookAndLogout({ error: null });

      expect(logoutResult).toEqual({ success: true, error: null });
      expect(window.location.assign).toHaveBeenCalledWith("/login");
    });
  });

  describe("Error handling scenarios", () => {
    const errorScenarios = [
      {
        id: "UT-USELOGOUT-002",
        name: "should_return_error_and_reset_state_when_signOut_fails",
        signOutResult: { error: { message: "Sign out failed" } },
        expectedResult: { success: false, error: { message: "Sign out failed" } },
      },
      {
        id: "UT-USELOGOUT-003",
        name: "should_handle_exception_and_reset_state_when_signOut_throws",
        signOutResult: "throw_error",
        expectedResult: { success: false, error: new Error("Network error") },
      },
    ];

    errorScenarios.forEach(({ id, name, signOutResult, expectedResult }) => {
      describe(id, () => {
        it(name, async () => {
          const { result, logoutResult, mockUseSupabaseAuth } = await renderHookAndLogout(signOutResult);

          expect(mockUseSupabaseAuth.supabase.auth.signOut).toHaveBeenCalledTimes(1);
          expect(result.current.isLoggingOut).toBe(false);
          expect(logoutResult).toEqual(expectedResult);
        });
      });
    });
  });

  describe("UT-USELOGOUT-004: should_initialize_with_isLoggingOut_false", () => {
    it("should initialize with isLoggingOut false", () => {
      const mockUseSupabaseAuth = createMockUseSupabaseAuth();
      vi.mocked(useSupabaseAuth).mockReturnValue(mockUseSupabaseAuth);

      const { result } = renderHook(() => useLogout());
      expect(result.current.isLoggingOut).toBe(false);
    });
  });

  describe("UT-USELOGOUT-005: should_use_supabase_from_useSupabaseAuth", () => {
    it("should use supabase from useSupabaseAuth", async () => {
      const customClient = createMockAuthSupabaseClient();
      const customUseSupabaseAuth = createMockUseSupabaseAuth({ supabase: customClient });

      vi.mocked(customClient.auth.signOut).mockResolvedValue({ error: null });
      vi.mocked(useSupabaseAuth).mockReturnValue(customUseSupabaseAuth);

      const { result } = renderHook(() => useLogout());

      await act(async () => {
        await result.current.logout();
      });

      expect(customClient.auth.signOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("UT-USELOGOUT-006: should_memoize_logout_function", () => {
    it("should memoize logout function", () => {
      const mockUseSupabaseAuth = createMockUseSupabaseAuth();
      vi.mocked(useSupabaseAuth).mockReturnValue(mockUseSupabaseAuth);

      const { result, rerender } = renderHook(() => useLogout());

      const firstLogoutFunction = result.current.logout;
      rerender();

      expect(result.current.logout).toBe(firstLogoutFunction);
    });
  });

  describe("UT-USELOGOUT-007: should_set_isLoggingOut_true_at_start_of_logout", () => {
    it("should set isLoggingOut true at start of logout", async () => {
      const mockClient = createMockAuthSupabaseClient();
      const mockUseSupabaseAuth = createMockUseSupabaseAuth({ supabase: mockClient });

      // Mock to never resolve to test synchronous state change
      vi.mocked(mockClient.auth.signOut).mockImplementation(() => new Promise(() => {}));
      vi.mocked(useSupabaseAuth).mockReturnValue(mockUseSupabaseAuth);

      const { result } = renderHook(() => useLogout());

      act(() => {
        result.current.logout();
      });

      expect(result.current.isLoggingOut).toBe(true);
    });
  });
});
