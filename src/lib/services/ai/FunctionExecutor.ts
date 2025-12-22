/**
 * Function Executor Service
 *
 * Executes AI function calls by dispatching to appropriate handlers
 */

import type { FunctionName } from "@/lib/ai/chatTypes";
import type { SupabaseClient } from "@/db/supabase.client";
import { BalanceService } from "@/lib/services/balanceService";
import { BalanceRepository } from "@/lib/services/repositories/BalanceRepository";
import { getGroupExpenses } from "@/lib/services/expenseService";
import { getGroupMemberDetails } from "@/lib/services/memberService";
import { listGroups, getGroupDetails, getGroupCurrencies } from "@/lib/services/groupService";

/**
 * Function execution context
 */
export interface FunctionExecutionContext {
  supabase: SupabaseClient;
  userId: string;
  groupId: string | null;
}

/**
 * Function execution result
 */
export interface FunctionExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Function Executor Service
 */
export class FunctionExecutor {
  constructor(private readonly context: FunctionExecutionContext) {}

  /**
   * Gets effective group ID, prioritizing context groupId (locking)
   */
  private getGroupId(args: Record<string, unknown>): string {
    const id = this.context.groupId || (args.group_id as string);
    if (!id) {
      throw new Error(
        "Group ID is required for this action. Please provide group_id in arguments or open the chat in a specific group."
      );
    }
    return id;
  }

  /**
   * Executes a function by name with given arguments
   */
  async execute(functionName: FunctionName, args: Record<string, unknown>): Promise<FunctionExecutionResult> {
    try {
      // Dispatch to appropriate handler
      switch (functionName) {
        // Specialized high-level tools
        case "get_member_balances":
          return await this.getMemberBalances(args);
        case "get_expenses_summary":
          return await this.getExpensesSummary(args);
        case "search_expenses":
          return await this.searchExpenses(args);

        // Generic low-level tools
        case "get_expenses":
          return await this.getExpenses(args);
        case "get_members":
          return await this.getMembers(args);
        case "get_group_metadata":
          return await this.getGroupMetadata(args);
        case "list_user_groups":
          return await this.listUserGroups(args);

        // Utility functions
        case "get_group_context":
          return await this.getGroupContext(args);
        case "get_currency_exchange_rates":
          return await this.getCurrencyExchangeRates(args);

        default:
          return {
            success: false,
            error: `Unknown function: ${functionName}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get member balances
   */
  private async getMemberBalances(args: Record<string, unknown>): Promise<FunctionExecutionResult> {
    const groupId = this.getGroupId(args);
    const balanceService = new BalanceService(new BalanceRepository(this.context.supabase));
    const balances = await balanceService.getGroupBalances(groupId, this.context.userId);

    // Filter by specific member if requested
    if (args.member_id) {
      const memberBalance = balances.member_balances.find((b) => b.profile_id === args.member_id);
      return {
        success: true,
        data: {
          group_id: groupId,
          base_currency_code: balances.base_currency_code,
          member_balance: memberBalance || null,
        },
      };
    }

    return {
      success: true,
      data: balances,
    };
  }

  /**
   * Get expenses summary for a time period
   */
  private async getExpensesSummary(args: Record<string, unknown>): Promise<FunctionExecutionResult> {
    const groupId = this.getGroupId(args);

    // Parse date range
    const startDate = args.start_date
      ? new Date(args.start_date as string)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = args.end_date ? new Date(args.end_date as string) : new Date();

    // Get expenses in date range
    const { data: expenses } = await getGroupExpenses(this.context.supabase, groupId, this.context.userId);
    const filteredExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.expense_date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    // Calculate total
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount_in_base_currency, 0);

    // Member breakdown if requested
    let memberBreakdown;
    if (args.include_member_breakdown) {
      const memberTotals = new Map<string, { name: string; total: number }>();
      for (const expense of filteredExpenses) {
        const payerId = expense.payer_id;
        const payerName = expense.created_by.full_name || "Unknown";
        const current = memberTotals.get(payerId) || { name: payerName, total: 0 };
        current.total += expense.amount_in_base_currency;
        memberTotals.set(payerId, current);
      }
      memberBreakdown = Array.from(memberTotals.values());
    }

    let currency = args.currency as string;
    if (!currency) {
      try {
        const groupCurrencies = await getGroupCurrencies(this.context.supabase, groupId, this.context.userId);
        currency = groupCurrencies.base_currency.code;
      } catch (error) {
        // Fallback to PLN if fetching fails (e.g. user not authorized in legacy flows, logical error)
        console.error("Failed to fetch group currency for default, falling back to PLN", error);
        currency = "PLN";
      }
    }

    return {
      success: true,
      data: {
        group_id: groupId,
        period: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
        },
        total,
        currency: currency,
        expense_count: filteredExpenses.length,
        member_breakdown: memberBreakdown,
      },
    };
  }

  /**
   * Search expenses by keyword and filters
   */
  private async searchExpenses(args: Record<string, unknown>): Promise<FunctionExecutionResult> {
    const groupId = this.getGroupId(args);
    const { data: expenses } = await getGroupExpenses(this.context.supabase, groupId, this.context.userId, {
      limit: 1000,
    });

    let filtered = expenses;

    // Filter by keyword
    if (args.keyword) {
      const keyword = (args.keyword as string).toLowerCase();
      filtered = filtered.filter((e) => e.description.toLowerCase().includes(keyword));
    }

    // Filter by date range
    if (args.start_date) {
      const startDate = new Date(args.start_date as string);
      filtered = filtered.filter((e) => new Date(e.expense_date) >= startDate);
    }
    if (args.end_date) {
      const endDate = new Date(args.end_date as string);
      filtered = filtered.filter((e) => new Date(e.expense_date) <= endDate);
    }

    // Filter by payer
    // Helper flag for "my expenses" to avoid ID hallucination
    if (args.own_expenses_only) {
      filtered = filtered.filter((e) => e.payer_id === this.context.userId);
    } else if (args.payer_id) {
      filtered = filtered.filter((e) => e.payer_id === args.payer_id);
    }

    // Filter by amount range
    if (args.min_amount !== undefined) {
      filtered = filtered.filter((e) => e.amount_in_base_currency >= (args.min_amount as number));
    }
    if (args.max_amount !== undefined) {
      filtered = filtered.filter((e) => e.amount_in_base_currency <= (args.max_amount as number));
    }

    // Apply limit
    const limit = (args.limit as number) || 10;
    const results = filtered.slice(0, limit);

    return {
      success: true,
      data: {
        group_id: groupId,
        results,
        total_found: filtered.length,
        returned: results.length,
      },
    };
  }

  /**
   * Get raw expenses with pagination
   */
  private async getExpenses(args: Record<string, unknown>): Promise<FunctionExecutionResult> {
    const groupId = this.getGroupId(args);
    const { data: expenses } = await getGroupExpenses(this.context.supabase, groupId, this.context.userId, {
      limit: 1000,
    });

    // Apply filters similar to search_expenses
    let filtered = expenses;

    if (args.start_date) {
      const startDate = new Date(args.start_date as string);
      filtered = filtered.filter((e) => new Date(e.expense_date) >= startDate);
    }
    if (args.end_date) {
      const endDate = new Date(args.end_date as string);
      filtered = filtered.filter((e) => new Date(e.expense_date) <= endDate);
    }
    if (args.payer_id) {
      filtered = filtered.filter((e) => e.payer_id === args.payer_id);
    }

    // Pagination
    const limit = Math.min((args.limit as number) || 50, 100);
    const page = (args.page as number) || 1;
    const offset = (page - 1) * limit;
    const paginatedExpenses = filtered.slice(offset, offset + limit);

    return {
      success: true,
      data: {
        group_id: groupId,
        expenses: paginatedExpenses,
        metadata: {
          total_count: filtered.length,
          page,
          limit,
          has_next_page: offset + limit < filtered.length,
          total_pages: Math.ceil(filtered.length / limit),
        },
      },
    };
  }

  /**
   * Get group members
   */
  private async getMembers(args: Record<string, unknown>): Promise<FunctionExecutionResult> {
    const groupId = this.getGroupId(args);
    const members = await getGroupMemberDetails(this.context.supabase, groupId);

    return {
      success: true,
      data: {
        group_id: groupId,
        members,
        total_members: members.length,
      },
    };
  }

  /**
   * Get group metadata
   */
  private async getGroupMetadata(args: Record<string, unknown>): Promise<FunctionExecutionResult> {
    const groupId = this.getGroupId(args);
    const group = await getGroupDetails(this.context.supabase, groupId, this.context.userId);

    return {
      success: true,
      data: group,
    };
  }

  /**
   * Get group context (basic info)
   */
  private async getGroupContext(args: Record<string, unknown>): Promise<FunctionExecutionResult> {
    return this.getGroupMetadata(args);
  }

  /**
   * Get currency exchange rates
   */
  private async getCurrencyExchangeRates(args: Record<string, unknown>): Promise<FunctionExecutionResult> {
    const groupId = this.getGroupId(args);
    const currencies = await getGroupCurrencies(this.context.supabase, groupId, this.context.userId);

    return {
      success: true,
      data: {
        group_id: groupId,
        base_currency: currencies.base_currency,
        additional_currencies: currencies.additional_currencies,
      },
    };
  }

  /**
   * List user's groups
   */
  private async listUserGroups(args: Record<string, unknown>): Promise<FunctionExecutionResult> {
    try {
      const limit = Math.min((args.limit as number) || 50, 100);
      const offset = (args.offset as number) || 0;
      const status = args.status as "active" | "archived" | undefined;

      const result = await listGroups(this.context.supabase, this.context.userId, { limit, offset, status });

      return {
        success: true,
        data: {
          groups: result.data,
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list user groups",
      };
    }
  }
}
