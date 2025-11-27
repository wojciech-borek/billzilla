/**
 * Tests for balance calculation service
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { BalanceService } from "../../lib/services/balanceService";
import { BalanceRepository } from "../../lib/services/repositories/BalanceRepository";
import type { SupabaseClient } from "../../db/supabase.client";

interface TestData {
  expenses?: unknown[];
  expense_splits?: unknown[];
  settlements?: unknown[];
  group_currencies?: unknown[];
}

// Create a simple mock that returns the test data
const createMockSupabase = (testData: TestData = {}) => {
  const data = {
    expenses: [],
    expense_splits: [],
    settlements: [],
    group_currencies: [],
    ...testData,
  };

  const createQueryBuilder = (tableName: string) => ({
    in: vi.fn(() => ({
      eq: vi.fn((field: string, value: unknown) => {
        if (tableName === "expenses" && field === "payer_id") {
          return {
            data: data.expenses.filter((e: unknown) => (e as { payer_id: string }).payer_id === value) || [],
            error: null,
          };
        }
        return {
          data: data.expenses || [],
          error: null,
        };
      }),
      or: vi.fn(() => ({
        data: data.settlements || [],
        error: null,
      })),
      data: data.group_currencies || [],
      error: null,
    })),
    eq: vi.fn((field: string, value: unknown) => {
      if (tableName === "expense_splits" && field === "profile_id") {
        return {
          in: vi.fn(() => ({
            data: data.expense_splits.filter((s: unknown) => (s as { profile_id: string }).profile_id === value) || [],
            error: null,
          })),
        };
      }
      return {
        in: vi.fn(() => ({
          data: data.expense_splits || [],
          error: null,
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      };
    }),
  });

  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => createQueryBuilder(table)),
    })),
  } as unknown as SupabaseClient;
};

describe("calculateUserBalances", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate correct balance for simple expense split", async () => {
    // Mock data: User A pays $100, split equally with B and C
    // Expected: A should have +66.67, B and C should have -33.33 each

    const userId = "user-a";
    const groupId = "group-1";

    const mockSupabase = createMockSupabase({
      expenses: [
        {
          group_id: groupId,
          amount: 100,
          currency_code: "USD",
          payer_id: userId,
        },
      ],
      expense_splits: [
        {
          profile_id: userId,
          amount: 33.33,
          expenses: {
            group_id: groupId,
            currency_code: "USD",
          },
        },
      ],
      group_currencies: [
        {
          group_id: groupId,
          currency_code: "USD",
          exchange_rate: 1.0,
        },
      ],
    });

    const balanceService = new BalanceService(new BalanceRepository(mockSupabase));
    const result = await balanceService.calculateUserBalances(userId, [groupId]);
    const balance = result.get(groupId);

    // A paid 100 but owes 33.33, so balance should be 100 - 33.33 = 66.67
    expect(balance).toBeCloseTo(66.67, 2);
  });

  it("should handle currency conversion correctly", async () => {
    const userId = "user-a";
    const groupId = "group-1";

    const mockSupabase = createMockSupabase({
      expenses: [
        {
          group_id: groupId,
          amount: 100,
          currency_code: "EUR",
          payer_id: userId,
        },
      ],
      expense_splits: [
        {
          profile_id: userId,
          amount: 50,
          expenses: {
            group_id: groupId,
            currency_code: "EUR",
          },
        },
      ],
      group_currencies: [
        {
          group_id: groupId,
          currency_code: "EUR",
          exchange_rate: 0.85, // 1 EUR = 0.85 USD
        },
      ],
    });

    const balanceService = new BalanceService(new BalanceRepository(mockSupabase));
    const result = await balanceService.calculateUserBalances(userId, [groupId]);
    const balance = result.get(groupId);

    // A paid 100 EUR = 85 USD, owes 50 EUR = 42.5 USD
    // Balance: 85 - 42.5 = 42.5
    expect(balance).toBeCloseTo(42.5, 2);
  });

  it("should reduce balance when settlements pay down debt", async () => {
    const userId = "user-a";
    const groupId = "group-1";

    const mockSupabase = createMockSupabase({
      expenses: [
        {
          group_id: groupId,
          amount: 100,
          currency_code: "USD",
          payer_id: "user-b",
        },
      ],
      expense_splits: [
        {
          profile_id: userId,
          amount: 100,
          expenses: {
            group_id: groupId,
            currency_code: "USD",
          },
        },
      ],
      settlements: [
        {
          group_id: groupId,
          amount: 100,
          payer_id: userId, // user-a pays user-b to settle
          payee_id: "user-b",
        },
      ],
      group_currencies: [
        {
          group_id: groupId,
          currency_code: "USD",
          exchange_rate: 1.0,
        },
      ],
    });

    const balanceService = new BalanceService(new BalanceRepository(mockSupabase));
    const result = await balanceService.calculateUserBalances(userId, [groupId]);
    const balance = result.get(groupId);

    // user-a owed 100 but settled 100, so balance should return to 0
    expect(balance).toBeCloseTo(0, 2);
  });

  it("should handle multiple currencies in the same group", async () => {
    const userId = "user-a";
    const groupId = "group-1";

    const mockSupabase = createMockSupabase({
      expenses: [
        {
          group_id: groupId,
          amount: 100,
          currency_code: "EUR",
          payer_id: userId,
        },
        {
          group_id: groupId,
          amount: 50,
          currency_code: "USD",
          payer_id: "user-b", // Someone else paid
        },
      ],
      expense_splits: [
        {
          profile_id: userId,
          amount: 50,
          expenses: {
            group_id: groupId,
            currency_code: "EUR",
          },
        },
        {
          profile_id: userId,
          amount: 25,
          expenses: {
            group_id: groupId,
            currency_code: "USD",
          },
        },
      ],
      group_currencies: [
        {
          group_id: groupId,
          currency_code: "EUR",
          exchange_rate: 0.85,
        },
        {
          group_id: groupId,
          currency_code: "USD",
          exchange_rate: 1.0,
        },
      ],
    });

    const balanceService = new BalanceService(new BalanceRepository(mockSupabase));
    const result = await balanceService.calculateUserBalances(userId, [groupId]);
    const balance = result.get(groupId);

    // A paid 100 EUR = 85 USD, owes 50 EUR = 42.5 USD
    // A also owes 25 USD for the other expense
    // Total balance: 85 - 42.5 - 25 = 17.5
    expect(balance).toBeCloseTo(17.5, 2);
  });
});
