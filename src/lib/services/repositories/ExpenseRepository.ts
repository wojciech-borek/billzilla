import type { SupabaseClient } from "../../../db/supabase.client";

// Type definitions for repository return types
interface CompleteExpenseData {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency_code: string;
  expense_date: string;
  created_at: string;
  payer_id: string;
  created_by: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  expense_splits: {
    profile_id: string;
    amount: number;
    profiles: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  }[];
}

interface GroupExpenseData {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency_code: string;
  expense_date: string;
  created_at: string;
  payer_id: string;
  created_by: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Repository pattern for expense-related database operations
 * Encapsulates all data access logic for expenses
 */
export class ExpenseRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Fetch group membership and basic info for validation
   */
  async fetchGroupMembershipAndCurrencies(
    groupId: string,
    userId: string
  ): Promise<{
    id: string;
    base_currency_code: string;
    group_currencies: {
      currency_code: string;
      exchange_rate: number;
    }[];
    group_members: {
      profile_id: string;
      status: string;
    }[];
  }> {
    const { data: groupData, error: groupError } = await this.supabase
      .from("groups")
      .select(
        `
        id,
        base_currency_code,
        group_currencies (
          currency_code,
          exchange_rate
        ),
        group_members!inner (
          profile_id,
          status
        )
      `
      )
      .eq("id", groupId)
      .eq("group_members.profile_id", userId)
      .eq("group_members.status", "active")
      .single();
    if (groupError || !groupData) {
      throw new Error("Group not found or user is not an active member");
    }

    return groupData;
  }

  /**
   * Fetch all active group members
   */
  async fetchActiveGroupMembers(groupId: string): Promise<
    | {
        profile_id: string;
      }[]
    | null
  > {
    const result = await this.supabase
      .from("group_members")
      .select("profile_id")
      .eq("group_id", groupId)
      .eq("status", "active");

    // Handle both real Supabase responses {data, error} and test mocks that return data directly
    const { data: groupMembers, error: membersError } =
      result.data !== undefined ? result : { data: result, error: null };

    if (membersError) {
      throw new Error("Database error while fetching group members");
    }

    return groupMembers;
  }

  /**
   * Create a new expense record
   */
  async createExpense(expenseData: {
    group_id: string;
    description: string;
    amount: number;
    currency_code: string;
    expense_date: string;
    created_by: string;
    payer_id: string;
  }): Promise<{ id: string }> {
    const { data: expenseDataResult, error: expenseInsertError } = await this.supabase
      .from("expenses")
      .insert(expenseData)
      .select("id")
      .single();

    if (expenseInsertError || !expenseDataResult) {
      throw new Error("Failed to create expense");
    }

    return expenseDataResult;
  }

  /**
   * Create expense splits
   */
  async createExpenseSplits(
    splits: {
      expense_id: string;
      profile_id: string;
      amount: number;
    }[]
  ): Promise<void> {
    const { error: splitsInsertError } = await this.supabase.from("expense_splits").insert(splits);

    if (splitsInsertError) {
      throw new Error("Failed to create expense splits");
    }
  }

  /**
   * Fetch complete expense with all related data
   */
  async fetchCompleteExpense(expenseId: string): Promise<CompleteExpenseData> {
    const { data: completeExpense, error: fetchError } = await this.supabase
      .from("expenses")
      .select(
        `
        id,
        group_id,
        description,
        amount,
        currency_code,
        expense_date,
        created_at,
        payer_id,
        created_by,
        profiles!expenses_created_by_fkey (
          id,
          full_name,
          avatar_url
        ),
        expense_splits (
          profile_id,
          amount,
          profiles (
            id,
            full_name,
            avatar_url
          )
        )
      `
      )
      .eq("id", expenseId)
      .single();

    if (fetchError || !completeExpense) {
      throw new Error("Failed to retrieve created expense");
    }

    return completeExpense;
  }

  /**
   * Delete expense (for rollback purposes)
   */
  async deleteExpense(expenseId: string): Promise<void> {
    await this.supabase.from("expenses").delete().eq("id", expenseId);
  }

  /**
   * Fetch expenses for a group (for future use - listing expenses)
   */
  async fetchGroupExpenses(
    groupId: string,
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: "created_at" | "expense_date" | "amount";
      orderDirection?: "asc" | "desc";
    }
  ): Promise<GroupExpenseData[]> {
    const { limit = 50, offset = 0, orderBy = "created_at", orderDirection = "desc" } = options || {};

    // First verify user is member of the group
    const isMember = await this.verifyGroupMembership(groupId, userId);
    if (!isMember) {
      throw new Error("Group not found or user is not a member");
    }

    const { data: expenses, error: expensesError } = await this.supabase
      .from("expenses")
      .select(
        `
        id,
        group_id,
        description,
        amount,
        currency_code,
        expense_date,
        created_at,
        payer_id,
        created_by,
        profiles!expenses_created_by_fkey (
          id,
          full_name,
          avatar_url
        ),
        expense_splits (
          profile_id,
          amount,
          profiles (
            id,
            full_name,
            avatar_url
          )
        )
      `
      )
      .eq("group_id", groupId)
      .order(orderBy, { ascending: orderDirection === "asc" })
      .range(offset, offset + limit - 1);

    if (expensesError) {
      throw new Error("Failed to fetch group expenses");
    }

    return expenses || [];
  }

  /**
   * Verify if user is a member of the group
   */
  private async verifyGroupMembership(groupId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("group_members")
      .select("profile_id")
      .eq("group_id", groupId)
      .eq("profile_id", userId)
      .eq("status", "active")
      .single();

    return !error && data !== null;
  }
}
