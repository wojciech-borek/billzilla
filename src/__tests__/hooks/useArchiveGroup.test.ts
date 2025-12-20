import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useArchiveGroup } from "../../lib/hooks/useArchiveGroup";
import { createElement } from "react";
import type { ReactNode } from "react";

// Mock deps
vi.mock("../../db/supabase.client", () => ({
  createClient: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import mocked modules
import { createClient } from "../../db/supabase.client";
import { toast } from "sonner";

describe("useArchiveGroup", () => {
  let queryClient: QueryClient;
  let mockSupabaseClient: {
    auth: {
      getSession: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Create a fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock Supabase client
    mockSupabaseClient = {
      auth: {
        getSession: vi.fn(),
      },
    };

    vi.mocked(createClient).mockReturnValue(mockSupabaseClient as never);

    // Mock fetch globally
    global.fetch = vi.fn();
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  describe("should call archive API endpoint with correct parameters", () => {
    it("should call correct endpoint with POST method and authorization header", async () => {
      // Arrange
      const groupId = "group-123";
      const accessToken = "test-access-token";
      const mockArchivedGroup = {
        id: groupId,
        name: "Test Group",
        base_currency_code: "USD",
        status: "archived",
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { access_token: accessToken } },
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockArchivedGroup,
      } as Response);

      // Act
      const { result } = renderHook(() => useArchiveGroup(), { wrapper });
      result.current.mutate(groupId);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(`/api/groups/${groupId}/archive`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      });
    });
  });

  describe("should invalidate groups queries on success", () => {
    it("should invalidate queries with groups key", async () => {
      // Arrange
      const groupId = "group-123";
      const mockArchivedGroup = {
        id: groupId,
        name: "Test Group",
        base_currency_code: "USD",
        status: "archived",
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { access_token: "token" } },
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockArchivedGroup,
      } as Response);

      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      // Act
      const { result } = renderHook(() => useArchiveGroup(), { wrapper });
      result.current.mutate(groupId);

      // Assert
      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["groups"] });
      });
    });
  });

  describe("should show success toast on successful archive", () => {
    it("should call toast.success with Polish message", async () => {
      // Arrange
      const groupId = "group-123";
      const mockArchivedGroup = {
        id: groupId,
        name: "Test Group",
        base_currency_code: "USD",
        status: "archived",
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { access_token: "token" } },
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockArchivedGroup,
      } as Response);

      // Act
      const { result } = renderHook(() => useArchiveGroup(), { wrapper });
      result.current.mutate(groupId);

      // Assert
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Grupa została zarchiwizowana");
      });
    });
  });

  describe("should show error toast on failure", () => {
    it("should call toast.error with Polish message when archive fails", async () => {
      // Arrange
      const groupId = "group-123";

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { access_token: "token" } },
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "Server error" } }),
      } as Response);

      // Act
      const { result } = renderHook(() => useArchiveGroup(), { wrapper });
      result.current.mutate(groupId);

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Nie udało się zarchiwizować grupy. Spróbuj ponownie.");
      });
    });
  });

  describe("should handle API error responses", () => {
    const errorScenarios = [
      {
        status: 403,
        code: "FORBIDDEN",
        message: "Only creator can archive group",
        testName: "should handle 403 forbidden error",
      },
      {
        status: 404,
        code: "NOT_FOUND",
        message: "Group not found",
        testName: "should handle 404 not found error",
      },
    ];

    errorScenarios.forEach(({ status, code, message, testName }) => {
      it(testName, async () => {
        // Arrange
        const groupId = "group-123";

        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: { access_token: "token" } },
        });

        vi.mocked(global.fetch).mockResolvedValue({
          ok: false,
          status,
          json: async () => ({ error: { code, message } }),
        } as Response);

        // Act
        const { result } = renderHook(() => useArchiveGroup(), { wrapper });
        result.current.mutate(groupId);

        // Assert
        await waitFor(() => {
          expect(result.current.isError).toBe(true);
          expect(toast.error).toHaveBeenCalledWith("Nie udało się zarchiwizować grupy. Spróbuj ponownie.");
        });
      });
    });
  });

  describe("should handle network errors gracefully", () => {
    it("should handle fetch throwing network error", async () => {
      // Arrange
      const groupId = "group-123";

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { access_token: "token" } },
      });

      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

      // Act
      const { result } = renderHook(() => useArchiveGroup(), { wrapper });
      result.current.mutate(groupId);

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(toast.error).toHaveBeenCalledWith("Nie udało się zarchiwizować grupy. Spróbuj ponownie.");
      });
    });
  });
});
