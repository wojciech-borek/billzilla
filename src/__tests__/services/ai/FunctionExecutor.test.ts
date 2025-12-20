import { describe, it, expect, beforeEach, vi } from "vitest";
import { FunctionExecutor } from "@/lib/services/ai/FunctionExecutor";
import { listGroups } from "@/lib/services/groupService";
import { createMockSupabaseClient, type MockSupabaseClient } from "../testHelpers";

import { BalanceService } from "@/lib/services/balanceService";
import { getGroupExpenses } from "@/lib/services/expenseService";
// import { getGroupMemberDetails } from "@/lib/services/memberService";

// Mock the services
vi.mock("@/lib/services/groupService", () => ({
  listGroups: vi.fn(),
  getGroupDetails: vi.fn(),
  getGroupCurrencies: vi.fn(),
}));

vi.mock("@/lib/services/balanceService", () => {
  return {
    BalanceService: class {
      async getGroupBalances() {
        return {} as any;
      }
    },
  };
});

vi.mock("@/lib/services/expenseService", () => ({
  getGroupExpenses: vi.fn(),
}));

vi.mock("@/lib/services/memberService", () => ({
  getGroupMemberDetails: vi.fn(),
}));

vi.mock("@/lib/services/repositories/BalanceRepository", () => ({
  BalanceRepository: vi.fn(),
}));

let mockSupabaseClient: MockSupabaseClient;

beforeEach(() => {
  mockSupabaseClient = createMockSupabaseClient();
  vi.clearAllMocks();
});

describe("FunctionExecutor", () => {
  describe("listUserGroups", () => {
    it("should_return_user_groups_with_default_pagination", async () => {
      // Arrange
      const userId = "user-123";
      const mockGroupsData: any[] = [
        {
          id: "group-1",
          name: "Family Expenses",
          base_currency_code: "PLN",
          status: "active" as const,
          created_at: "2024-01-01T00:00:00Z",
          role: "creator",
          member_count: 3,
          my_balance: 150.0,
          members: [],
        },
        {
          id: "group-2",
          name: "Trip to Spain",
          base_currency_code: "EUR",
          status: "active" as const,
          created_at: "2024-02-01T00:00:00Z",
          role: "member",
          member_count: 5,
          my_balance: -50.0,
          members: [],
        },
      ];

      const mockResult = {
        data: mockGroupsData,
        total: 2,
        limit: 50,
        offset: 0,
      };

      vi.mocked(listGroups).mockResolvedValue(mockResult);

      const executor = new FunctionExecutor({
        supabase: mockSupabaseClient,
        userId,
        groupId: null,
      });

      // Act
      const result = await executor.execute("list_user_groups", {});

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        groups: mockGroupsData,
        total: 2,
        limit: 50,
        offset: 0,
      });
      expect(listGroups).toHaveBeenCalledWith(mockSupabaseClient, userId, { limit: 50, offset: 0, status: undefined });
    });

    it("should_respect_pagination_parameters", async () => {
      // Arrange
      const userId = "user-123";
      const mockResult = {
        data: [],
        total: 100,
        limit: 20,
        offset: 40,
      };

      vi.mocked(listGroups).mockResolvedValue(mockResult);

      const executor = new FunctionExecutor({
        supabase: mockSupabaseClient,
        userId,
        groupId: null,
      });

      // Act
      const result = await executor.execute("list_user_groups", {
        limit: 20,
        offset: 40,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        groups: mockResult.data,
        total: mockResult.total,
        limit: mockResult.limit,
        offset: mockResult.offset,
      });
      expect(listGroups).toHaveBeenCalledWith(mockSupabaseClient, userId, { limit: 20, offset: 40, status: undefined });
    });

    it("should_filter_by_status", async () => {
      // Arrange
      const userId = "user-123";
      const mockArchivedGroups: any[] = [
        {
          id: "group-archived",
          name: "Old Trip",
          base_currency_code: "USD",
          status: "archived" as const,
          created_at: "2023-01-01T00:00:00Z",
          role: "member",
          member_count: 4,
          my_balance: 0,
          members: [],
        },
      ];

      const mockResult = {
        data: mockArchivedGroups,
        total: 1,
        limit: 50,
        offset: 0,
      };

      vi.mocked(listGroups).mockResolvedValue(mockResult);

      const executor = new FunctionExecutor({
        supabase: mockSupabaseClient,
        userId,
        groupId: null,
      });

      // Act
      const result = await executor.execute("list_user_groups", {
        status: "archived",
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        groups: mockResult.data,
        total: mockResult.total,
        limit: mockResult.limit,
        offset: mockResult.offset,
      });
      expect(listGroups).toHaveBeenCalledWith(mockSupabaseClient, userId, { limit: 50, offset: 0, status: "archived" });
    });

    it("should_return_empty_array_when_user_has_no_groups", async () => {
      // Arrange
      const userId = "user-no-groups";
      const mockResult = {
        data: [],
        total: 0,
        limit: 50,
        offset: 0,
      };

      vi.mocked(listGroups).mockResolvedValue(mockResult);

      const executor = new FunctionExecutor({
        supabase: mockSupabaseClient,
        userId,
        groupId: null,
      });

      // Act
      const result = await executor.execute("list_user_groups", {});

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        groups: [],
        total: 0,
        limit: 50,
        offset: 0,
      });
    });

    it("should_enforce_maximum_limit_of_100", async () => {
      // Arrange
      const userId = "user-123";
      const mockResult = {
        data: [],
        total: 0,
        limit: 100,
        offset: 0,
      };

      vi.mocked(listGroups).mockResolvedValue(mockResult);

      const executor = new FunctionExecutor({
        supabase: mockSupabaseClient,
        userId,
        groupId: null,
      });

      // Act
      const result = await executor.execute("list_user_groups", {
        limit: 200, // Try to request more than max
      });

      // Assert
      expect(result.success).toBe(true);
      // Should be capped at 100
      expect(listGroups).toHaveBeenCalledWith(mockSupabaseClient, userId, { limit: 100, offset: 0, status: undefined });
    });

    it("should_return_error_when_service_throws", async () => {
      // Arrange
      const userId = "user-123";
      const errorMessage = "Database connection failed";

      vi.mocked(listGroups).mockRejectedValue(new Error(errorMessage));

      const executor = new FunctionExecutor({
        supabase: mockSupabaseClient,
        userId,
        groupId: null,
      });

      // Act
      const result = await executor.execute("list_user_groups", {});

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe("Group Context Logic", () => {
    it("should use groupId from context when present (lock-in)", async () => {
      const mockGetGroupBalances = vi.spyOn(BalanceService.prototype, "getGroupBalances").mockResolvedValue({
        member_balances: [],
        base_currency_code: "PLN",
        group_id: "locked-group-id",
        calculated_at: new Date().toISOString(),
        suggested_settlements: [],
      } as any);
      const executor = new FunctionExecutor({
        supabase: mockSupabaseClient,
        userId: "user-123",
        groupId: "locked-group-id",
      });

      // Even if AI provides another group_id, context should win
      await executor.execute("get_member_balances", { group_id: "ai-provided-id" });

      expect(mockGetGroupBalances).toHaveBeenCalledWith("locked-group-id", "user-123");
    });

    it("should use groupId from args when context is null (dashboard mode)", async () => {
      const mockGetGroupBalances = vi.spyOn(BalanceService.prototype, "getGroupBalances").mockResolvedValue({
        member_balances: [],
        base_currency_code: "PLN",
        group_id: "ai-provided-id",
        calculated_at: new Date().toISOString(),
        suggested_settlements: [],
      } as any);
      const executor = new FunctionExecutor({
        supabase: mockSupabaseClient,
        userId: "user-123",
        groupId: null,
      });

      await executor.execute("get_member_balances", { group_id: "ai-provided-id" });

      expect(mockGetGroupBalances).toHaveBeenCalledWith("ai-provided-id", "user-123");
    });

    it("should return error when no group_id is provided in dashboard mode", async () => {
      const executor = new FunctionExecutor({
        supabase: mockSupabaseClient,
        userId: "user-123",
        groupId: null,
      });

      const result = await executor.execute("get_member_balances", {});

      expect(result.success).toBe(false);
      expect(result.error).toContain("Group ID is required");
    });
  });
  describe("analyze_spending_trends date filtering", () => {
    it("should include expenses on the end date with time component", async () => {
      // Arrange
      const userId = "user-123";
      const groupId = "group-1";
      const mockExpenses = [
        {
          id: "exp-1",
          amount_in_base_currency: 100,
          expense_date: "2025-12-20T15:30:00.000Z", // Afternoon expense
          group_id: groupId,
        },
      ];

      // Mock getGroupExpenses to return our test expense
      vi.mocked(getGroupExpenses).mockResolvedValue({
        data: mockExpenses,
      } as any);

      const executor = new FunctionExecutor({
        supabase: mockSupabaseClient,
        userId,
        groupId,
      });

      // Act
      // Request analysis ending on 2025-12-20
      const result = await executor.execute("analyze_spending_trends", {
        group_id: groupId,
        current_period_start: "2025-12-01",
        current_period_end: "2025-12-20", // The day of the expense
        comparison_period_start: "2025-11-01",
        comparison_period_end: "2025-11-30",
      });

      // Assert
      expect(result.success).toBe(true);
      // Logic bug: if end date is 00:00:00, this will be 0 instead of 100
      // We expect it to be 100 if working correctly
      const data = result.data as any;
      expect(data.current_period.total).toBe(100);
    });
  });
});
