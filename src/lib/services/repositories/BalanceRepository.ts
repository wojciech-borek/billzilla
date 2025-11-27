import type { SupabaseClient, GroupMemberStatus } from "../../../db/supabase.client";
import { BalanceCalculationError } from "../balanceService";

// Type definitions for repository return types
interface ExpenseData {
  group_id: string;
  amount: number;
  currency_code: string;
}

interface ExpenseSplitWithExpense {
  amount: number;
  expense_id: string;
  expenses: {
    group_id: string;
    currency_code: string;
  };
}

interface SettlementData {
  group_id: string;
  amount: number;
  payer_id: string;
  payee_id: string;
}

interface MemberWithProfile {
  profile_id: string;
  status: GroupMemberStatus;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Repository pattern for balance-related database operations
 * Encapsulates all data access logic for balance calculations
 */
export class BalanceRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Fetch expenses paid by user in specified groups
   */
  async fetchUserExpenses(userId: string, groupIds: string[]): Promise<ExpenseData[]> {
    const { data: userExpenses, error: expensesError } = await this.supabase
      .from("expenses")
      .select("group_id, amount, currency_code")
      .in("group_id", groupIds)
      .eq("payer_id", userId);

    if (expensesError) {
      throw new BalanceCalculationError("fetch user expenses", expensesError.message);
    }

    return userExpenses || [];
  }

  /**
   * Fetch expense splits for user in specified groups
   */
  async fetchUserExpenseSplits(userId: string, groupIds: string[]): Promise<ExpenseSplitWithExpense[]> {
    // First get all expenses for the specified groups
    const { data: expenses, error: expensesError } = await this.supabase
      .from("expenses")
      .select("id, group_id")
      .in("group_id", groupIds);

    if (expensesError) {
      throw new BalanceCalculationError("fetch expenses for groups", expensesError.message);
    }

    const expenseIds = expenses?.map((e) => e.id) || [];

    if (expenseIds.length === 0) {
      return [];
    }

    // Now fetch splits for these specific expense IDs
    const { data: userSplits, error: splitsError } = await this.supabase
      .from("expense_splits")
      .select(
        `
        amount,
        expense_id,
        expenses!inner(
          group_id,
          currency_code
        )
      `
      )
      .eq("profile_id", userId)
      .in("expense_id", expenseIds);

    if (splitsError) {
      throw new BalanceCalculationError("fetch user expense splits", splitsError.message);
    }

    return userSplits || [];
  }

  /**
   * Fetch settlements involving user in specified groups
   */
  async fetchUserSettlements(userId: string, groupIds: string[]): Promise<SettlementData[]> {
    const { data: settlements, error: settlementsError } = await this.supabase
      .from("settlements")
      .select("group_id, amount, payer_id, payee_id")
      .in("group_id", groupIds)
      .or(`payer_id.eq.${userId},payee_id.eq.${userId}`);

    if (settlementsError) {
      throw new BalanceCalculationError("fetch settlements", settlementsError.message);
    }

    return settlements || [];
  }

  /**
   * Fetch exchange rates for all group currencies
   */
  async fetchExchangeRates(groupIds: string[]): Promise<Map<string, Map<string, number>>> {
    const { data: groupCurrencies, error: currenciesError } = await this.supabase
      .from("group_currencies")
      .select("group_id, currency_code, exchange_rate")
      .in("group_id", groupIds);

    if (currenciesError) {
      throw new BalanceCalculationError("fetch group currencies", currenciesError.message);
    }

    // Build exchange rate lookup: groupId -> currencyCode -> exchangeRate
    const exchangeRates = new Map<string, Map<string, number>>();
    for (const gc of groupCurrencies || []) {
      if (!exchangeRates.has(gc.group_id)) {
        exchangeRates.set(gc.group_id, new Map());
      }
      const groupRates = exchangeRates.get(gc.group_id);
      if (groupRates) {
        groupRates.set(gc.currency_code, gc.exchange_rate);
      }
    }

    return exchangeRates;
  }

  /**
   * Verify if user is a member of the group
   */
  async verifyGroupMembership(groupId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("group_members")
      .select("profile_id")
      .eq("group_id", groupId)
      .eq("profile_id", userId)
      .eq("status", "active")
      .single();

    return !error && data !== null;
  }

  /**
   * Fetch group details including base currency
   */
  async fetchGroupBasic(groupId: string): Promise<{ id: string; name: string; base_currency_code: string }> {
    const { data: group, error: groupError } = await this.supabase
      .from("groups")
      .select("id, name, base_currency_code")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      throw new BalanceCalculationError("Group not found");
    }

    return group;
  }

  /**
   * Fetch all active group members with profiles
   */
  async fetchActiveGroupMembers(groupId: string): Promise<MemberWithProfile[]> {
    const { data: allMembers, error: allMembersError } = await this.supabase
      .from("group_members")
      .select(
        `
        profile_id,
        status,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .eq("group_id", groupId);

    if (allMembersError) {
      throw new BalanceCalculationError("Failed to fetch group members", allMembersError.message);
    }

    // Filter to only active members
    const members = allMembers?.filter((m) => m.status === "active") || [];

    if (!members || members.length === 0) {
      throw new BalanceCalculationError("Group has no active members");
    }

    return members;
  }
}
