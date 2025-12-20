import { describe, it, expect, beforeEach, vi } from "vitest";
import { FunctionExecutor } from "@/lib/services/ai/FunctionExecutor";
import { getGroupExpenses } from "@/lib/services/expenseService";
import { getGroupCurrencies } from "@/lib/services/groupService";
import { createMockSupabaseClient, type MockSupabaseClient } from "../testHelpers";

// Mock the services
vi.mock("@/lib/services/expenseService", () => ({
  getGroupExpenses: vi.fn(),
}));

vi.mock("@/lib/services/groupService", () => ({
  listGroups: vi.fn(),
  getGroupDetails: vi.fn(),
  getGroupCurrencies: vi.fn(),
}));

vi.mock("@/lib/services/balanceService", () => ({
  BalanceService: class {
    async getGroupBalances() {
      return {} as any;
    }
  },
}));

vi.mock("@/lib/services/repositories/BalanceRepository", () => ({
  BalanceRepository: vi.fn(),
}));

let mockSupabaseClient: MockSupabaseClient;

beforeEach(() => {
  mockSupabaseClient = createMockSupabaseClient();
  vi.clearAllMocks();
});

describe("FunctionExecutor Currency Fallback", () => {
  it("should use provided currency if args.currency is present", async () => {
    const userId = "user-123";
    const groupId = "group-1";

    vi.mocked(getGroupExpenses).mockResolvedValue({
      data: [],
      count: 0,
    } as any);

    const executor = new FunctionExecutor({
      supabase: mockSupabaseClient,
      userId,
      groupId,
    });

    const result = await executor.execute("get_expenses_summary", {
      currency: "EUR",
    });

    expect(result.success).toBe(true);
    expect((result.data as any).currency).toBe("EUR");
  });

  it("should fetch group base currency if args.currency is missing", async () => {
    const userId = "user-123";
    const groupId = "group-1";
    const baseCurrency = "GBP";

    vi.mocked(getGroupExpenses).mockResolvedValue({
      data: [],
      count: 0,
    } as any);

    vi.mocked(getGroupCurrencies).mockResolvedValue({
      base_currency: { code: baseCurrency, name: "Pound Sterling", exchange_rate: 1 },
      additional_currencies: [],
    });

    const executor = new FunctionExecutor({
      supabase: mockSupabaseClient,
      userId,
      groupId,
    });

    const result = await executor.execute("get_expenses_summary", {});

    expect(result.success).toBe(true);
    expect((result.data as any).currency).toBe(baseCurrency);
    expect(getGroupCurrencies).toHaveBeenCalledWith(mockSupabaseClient, groupId, userId);
  });

  it("should fallback to 'PLN' (or default) if fetching group currency fails", async () => {
    const userId = "user-123";
    const groupId = "group-1";

    vi.mocked(getGroupExpenses).mockResolvedValue({
      data: [],
      count: 0,
    } as any);

    vi.mocked(getGroupCurrencies).mockRejectedValue(new Error("Failed to fetch"));

    const executor = new FunctionExecutor({
      supabase: mockSupabaseClient,
      userId,
      groupId,
    });

    const result = await executor.execute("get_expenses_summary", {});

    expect(result.success).toBe(true);
    expect((result.data as any).currency).toBe("PLN");
  });
});
