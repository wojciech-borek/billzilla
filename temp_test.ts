import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import {
  createGroup,
  CurrencyNotFoundError,
} from "@/lib/services/groupService";

// Mock Supabase
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

// Mock the supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  count: vi.fn().mockReturnThis(),
  head: vi.fn().mockReturnThis(),
};

beforeEach(() => {
  vi.clearAllMocks();
  // Reset mock implementations
  Object.values(mockSupabase).forEach((mock) => {
    if (typeof mock === "function" && "mockReset" in mock) {
      mock.mockReset();
    }
  });
  // Setup default chainable mocks
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.range.mockReturnValue(mockSupabase);
  mockSupabase.in.mockReturnValue(mockSupabase);
  mockSupabase.or.mockReturnValue(mockSupabase);
  mockSupabase.count.mockReturnValue(mockSupabase);
  mockSupabase.head.mockReturnValue(mockSupabase);
});

describe("Test", () => {
  it("should_throw_currency_not_found_when_invalid_base_currency", async () => {
    // Arrange
    const mockSupabaseClient = mockSupabase as any;
    const command = {
      name: "Test Group",
      base_currency_code: "INVALID",
      invite_emails: [],
    };
    const userId = "user-123";

    // Mock currency validation failure
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Currency not found" },
    });

    // Act & Assert
    await expect(createGroup(mockSupabaseClient, command, userId)).rejects.toThrow(
      CurrencyNotFoundError
    );

    expect(mockSupabaseClient.from).toHaveBeenCalledWith("currencies");
    expect(mockSupabaseClient.select).toHaveBeenCalledWith("code");
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith("code", "INVALID");
    expect(mockSupabaseClient.single).toHaveBeenCalled();

    // RPC should not be called when currency validation fails
    expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();
  });
});
