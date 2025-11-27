/**
 * Tests for settlement service
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SettlementService } from "../../lib/services/settlementService";
import { BalanceRepository } from "../../lib/services/repositories/BalanceRepository";
import { SettlementRepository } from "../../lib/services/repositories/SettlementRepository";
import type { SupabaseClient } from "../../db/supabase.client";

// Mock the balance service
vi.mock("../../lib/services/balanceService", () => ({
  BalanceService: vi.fn().mockImplementation(() => ({
    getGroupBalances: vi.fn(),
  })),
}));

interface TestData {
  settlements?: unknown[];
  group_members?: unknown[];
  groups?: unknown[];
  member_balances?: unknown[];
}

// Create a mock supabase client for testing
const createMockSupabase = (testData: TestData = {}) => {
  const data = {
    settlements: [],
    group_members: [],
    groups: [],
    member_balances: [],
    ...testData,
  };

  const createQueryBuilder = (tableName: string) => ({
    select: vi.fn((fields?: string, options?: { count: string }) => {
      let queryResult = data[tableName as keyof typeof data] || [];

      // Handle joins for settlements
      if (tableName === "settlements" && fields?.includes("payer:") && fields?.includes("payee:")) {
        queryResult = (queryResult as unknown[]).map((settlement: any) => ({
          ...settlement,
          payer: { id: settlement.payer_id, full_name: "Payer Name", avatar_url: null },
          payee: { id: settlement.payee_id, full_name: "Payee Name", avatar_url: null },
        }));
      }

      const result = {
        eq: vi.fn((_field: string, _value: unknown) => ({
          in: vi.fn(() => ({
            data: queryResult,
            error: null,
          })),
          single: vi.fn(() => ({
            data: queryResult.length > 0 ? queryResult[0] : null,
            error: queryResult.length === 0 ? { message: "Not found" } : null,
          })),
          data: queryResult,
          error: null,
          order: vi.fn(() => ({
            range: vi.fn(() => ({
              data: queryResult,
              error: null,
              count: queryResult.length,
            })),
          })),
          range: vi.fn(() => ({
            data: queryResult,
            error: null,
            count: queryResult.length,
          })),
        })),
        in: vi.fn(() => ({
          data: queryResult,
          error: null,
        })),
        order: vi.fn(() => ({
          range: vi.fn(() => ({
            data: queryResult,
            error: null,
            count: queryResult.length,
          })),
        })),
        range: vi.fn(() => ({
          data: queryResult,
          error: null,
          count: queryResult.length,
        })),
      };

      // Add count if requested
      if (options?.count === "exact") {
        (result as any).count = queryResult.length;
      }

      return result;
    }),
    insert: vi.fn((value: unknown) => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            id: "settlement-1",
            group_id: "group-1",
            payer_id: (value as any).payer_id,
            payee_id: (value as any).payee_id,
            amount: (value as any).amount,
            settled_at: new Date().toISOString(),
            payer: { id: (value as any).payer_id, full_name: "Payer Name", avatar_url: null },
            payee: { id: (value as any).payee_id, full_name: "Payee Name", avatar_url: null },
          },
          error: null,
        })),
      })),
    })),
  });

  return {
    from: vi.fn((table: string) => createQueryBuilder(table)),
  } as unknown as SupabaseClient;
};

describe("settlementService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSettlement", () => {
    it("should create a settlement successfully", async () => {
      // Create mock balance service
      const mockBalanceService = {
        getGroupBalances: vi.fn().mockResolvedValue({
          group_id: "group-1",
          base_currency_code: "PLN",
          calculated_at: new Date().toISOString(),
          member_balances: [
            { profile_id: "user-a", balance: -50, full_name: "User A", avatar_url: null, status: "active" },
            { profile_id: "user-b", balance: 50, full_name: "User B", avatar_url: null, status: "active" },
          ],
          suggested_settlements: [],
        }),
      };

      const mockSupabase = createMockSupabase({
        group_members: [{ profile_id: "user-a" }, { profile_id: "user-b" }],
      });

      const command = {
        payer_id: "user-a",
        payee_id: "user-b",
        amount: 25,
      };

      const settlementService = new SettlementService(
        new SettlementRepository(mockSupabase),
        new BalanceRepository(mockSupabase),
        mockBalanceService as any
      );
      const result = await settlementService.createSettlement("group-1", command);

      expect(result).toBeDefined();
      expect(result.payer.id).toBe("user-a");
      expect(result.payee.id).toBe("user-b");
      expect(result.amount).toBe(25);
    });

    it("should throw error when payer is not a member", async () => {
      const mockSupabase = createMockSupabase({
        group_members: [{ profile_id: "user-b" }], // Missing user-a
      });

      const command = {
        payer_id: "user-a",
        payee_id: "user-b",
        amount: 25,
      };

      const settlementService = new SettlementService(
        new SettlementRepository(mockSupabase),
        new BalanceRepository(mockSupabase)
      );
      await expect(settlementService.createSettlement("group-1", command)).rejects.toThrow(
        "User user-a is not a member of this group"
      );
    });

    it("should throw error when payee is not a member", async () => {
      const mockSupabase = createMockSupabase({
        group_members: [{ profile_id: "user-a" }], // Missing user-b
      });

      const command = {
        payer_id: "user-a",
        payee_id: "user-b",
        amount: 25,
      };

      const settlementService = new SettlementService(
        new SettlementRepository(mockSupabase),
        new BalanceRepository(mockSupabase)
      );
      await expect(settlementService.createSettlement("group-1", command)).rejects.toThrow(
        "User user-b is not a member of this group"
      );
    });

    it("should throw error when no outstanding debt", async () => {
      // Create mock balance service
      const mockBalanceService = {
        getGroupBalances: vi.fn().mockResolvedValue({
          group_id: "group-1",
          base_currency_code: "PLN",
          calculated_at: new Date().toISOString(),
          member_balances: [
            { profile_id: "user-a", balance: 0, full_name: "User A", avatar_url: null, status: "active" },
            { profile_id: "user-b", balance: 0, full_name: "User B", avatar_url: null, status: "active" },
          ],
          suggested_settlements: [],
        }),
      };

      const mockSupabase = createMockSupabase({
        group_members: [{ profile_id: "user-a" }, { profile_id: "user-b" }],
      });

      const command = {
        payer_id: "user-a",
        payee_id: "user-b",
        amount: 25,
      };

      const settlementService = new SettlementService(
        new SettlementRepository(mockSupabase),
        new BalanceRepository(mockSupabase),
        mockBalanceService as any
      );
      await expect(settlementService.createSettlement("group-1", command)).rejects.toThrow(
        "No outstanding debt found between these users"
      );
    });

    it("should throw error when amount exceeds debt", async () => {
      // Create mock balance service
      const mockBalanceService = {
        getGroupBalances: vi.fn().mockResolvedValue({
          group_id: "group-1",
          base_currency_code: "PLN",
          calculated_at: new Date().toISOString(),
          member_balances: [
            { profile_id: "user-a", balance: -10, full_name: "User A", avatar_url: null, status: "active" }, // Owes only 10
            { profile_id: "user-b", balance: 10, full_name: "User B", avatar_url: null, status: "active" },
          ],
          suggested_settlements: [],
        }),
      };

      const mockSupabase = createMockSupabase({
        group_members: [{ profile_id: "user-a" }, { profile_id: "user-b" }],
      });

      const command = {
        payer_id: "user-a",
        payee_id: "user-b",
        amount: 25, // More than debt
      };

      const settlementService = new SettlementService(
        new SettlementRepository(mockSupabase),
        new BalanceRepository(mockSupabase),
        mockBalanceService as any
      );
      await expect(settlementService.createSettlement("group-1", command)).rejects.toThrow(
        "Settlement amount cannot exceed outstanding debt of 10.00"
      );
    });

    it("should throw error when amount is zero", async () => {
      const mockSupabase = createMockSupabase({
        group_members: [{ profile_id: "user-a" }, { profile_id: "user-b" }],
      });

      const command = {
        payer_id: "user-a",
        payee_id: "user-b",
        amount: 0,
      };

      const settlementService = new SettlementService(
        new SettlementRepository(mockSupabase),
        new BalanceRepository(mockSupabase)
      );
      await expect(settlementService.createSettlement("group-1", command)).rejects.toThrow(
        "Settlement amount must be positive"
      );
    });

    it("should throw error when amount is negative", async () => {
      const mockSupabase = createMockSupabase({
        group_members: [{ profile_id: "user-a" }, { profile_id: "user-b" }],
      });

      const command = {
        payer_id: "user-a",
        payee_id: "user-b",
        amount: -10,
      };

      const settlementService = new SettlementService(
        new SettlementRepository(mockSupabase),
        new BalanceRepository(mockSupabase)
      );
      await expect(settlementService.createSettlement("group-1", command)).rejects.toThrow(
        "Settlement amount must be positive"
      );
    });

    it("should throw error when payer and payee are the same", async () => {
      const mockSupabase = createMockSupabase({
        group_members: [{ profile_id: "user-a" }],
      });

      const command = {
        payer_id: "user-a",
        payee_id: "user-a",
        amount: 25,
      };

      const settlementService = new SettlementService(
        new SettlementRepository(mockSupabase),
        new BalanceRepository(mockSupabase)
      );
      await expect(settlementService.createSettlement("group-1", command)).rejects.toThrow(
        "Payer and payee cannot be the same person"
      );
    });
  });

  describe("listSettlements", () => {
    it("should list settlements with pagination", async () => {
      const mockSettlements = [
        {
          id: "settlement-1",
          group_id: "group-1",
          payer_id: "user-a",
          payee_id: "user-b",
          amount: 25,
          settled_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "settlement-2",
          group_id: "group-1",
          payer_id: "user-b",
          payee_id: "user-a",
          amount: 15,
          settled_at: "2024-01-02T00:00:00Z",
        },
      ];

      const mockSupabase = createMockSupabase({
        settlements: mockSettlements,
      });

      const settlementService = new SettlementService(
        new SettlementRepository(mockSupabase),
        new BalanceRepository(mockSupabase)
      );
      const result = await settlementService.listSettlements("group-1", { limit: 10, offset: 0 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it("should handle empty results", async () => {
      const mockSupabase = createMockSupabase({
        settlements: [],
      });

      const settlementService = new SettlementService(
        new SettlementRepository(mockSupabase),
        new BalanceRepository(mockSupabase)
      );
      const result = await settlementService.listSettlements("group-1");

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
