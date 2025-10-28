/**
 * Balance service - handles business logic for balance calculations
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

/**
 * Custom error for balance calculation failures
 */
export class BalanceCalculationError extends Error {
  constructor(operation: string, details?: string) {
    super(`Balance calculation failed during ${operation}${details ? `: ${details}` : ""}`);
    this.name = "BalanceCalculationError";
  }
}

/**
 * Fetches expenses paid by user in specified groups
 */
async function fetchUserExpenses(supabase: SupabaseClient<Database>, userId: string, groupIds: string[]) {
  const { data: userExpenses, error: expensesError } = await supabase
    .from("expenses")
    .select("group_id, amount, currency_code")
    .in("group_id", groupIds)
    .eq("created_by", userId);

  if (expensesError) {
    throw new BalanceCalculationError("fetch user expenses", expensesError.message);
  }

  return userExpenses || [];
}

/**
 * Fetches expense splits for user in specified groups
 */
async function fetchUserExpenseSplits(supabase: SupabaseClient<Database>, userId: string, groupIds: string[]) {
  const { data: userSplits, error: splitsError } = await supabase
    .from("expense_splits")
    .select(
      `
      amount,
      expenses!inner(
        group_id,
        currency_code
      )
    `
    )
    .eq("profile_id", userId)
    .in("expenses.group_id", groupIds);

  if (splitsError) {
    throw new BalanceCalculationError("fetch user expense splits", splitsError.message);
  }

  return userSplits || [];
}

/**
 * Fetches settlements involving user in specified groups
 */
async function fetchUserSettlements(supabase: SupabaseClient<Database>, userId: string, groupIds: string[]) {
  const { data: settlements, error: settlementsError } = await supabase
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
 * Fetches exchange rates for all group currencies
 */
async function fetchExchangeRates(
  supabase: SupabaseClient<Database>,
  groupIds: string[]
): Promise<Map<string, Map<string, number>>> {
  const { data: groupCurrencies, error: currenciesError } = await supabase
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
    exchangeRates.get(gc.group_id)!.set(gc.currency_code, gc.exchange_rate);
  }

  return exchangeRates;
}

/**
 * Calculates user's balance for each group in base currency
 *
 * Balance calculation formula:
 * Balance = (amounts paid by user) - (amounts owed by user) + (settlements received) - (settlements paid)
 * All amounts are converted to base currency using exchange rates
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user whose balance to calculate
 * @param groupIds - Array of group IDs to calculate balances for
 * @returns Map of groupId to balance amount
 * @throws {BalanceCalculationError} If any data fetching operation fails
 */
export async function calculateUserBalances(
  supabase: SupabaseClient<Database>,
  userId: string,
  groupIds: string[]
): Promise<Map<string, number>> {
  // Input validation
  if (!userId) {
    throw new BalanceCalculationError("calculate balances", "User ID is required");
  }
  if (!groupIds || groupIds.length === 0) {
    throw new BalanceCalculationError("calculate balances", "At least one group ID is required");
  }

  try {
    // Fetch all required data in parallel for performance
    const [userExpenses, userSplits, settlements, exchangeRates] = await Promise.all([
      fetchUserExpenses(supabase, userId, groupIds),
      fetchUserExpenseSplits(supabase, userId, groupIds),
      fetchUserSettlements(supabase, userId, groupIds),
      fetchExchangeRates(supabase, groupIds),
    ]);

    // Calculate balances per group
    const balancesByGroup = new Map<string, number>();

    // Initialize all groups with 0 balance
    for (const groupId of groupIds) {
      balancesByGroup.set(groupId, 0);
    }

    // Add amounts paid by user (converted to base currency)
    for (const expense of userExpenses) {
      const rate = exchangeRates.get(expense.group_id)?.get(expense.currency_code) || 1.0;
      const amountInBase = expense.amount * rate;
      balancesByGroup.set(expense.group_id, balancesByGroup.get(expense.group_id)! + amountInBase);
    }

    // Subtract amounts owed by user (converted to base currency)
    for (const split of userSplits) {
      const expenseData = split.expenses as unknown as { group_id: string; currency_code: string };
      const rate = exchangeRates.get(expenseData.group_id)?.get(expenseData.currency_code) || 1.0;
      const amountInBase = split.amount * rate;
      balancesByGroup.set(expenseData.group_id, balancesByGroup.get(expenseData.group_id)! - amountInBase);
    }

    // Add settlements received by user
    for (const settlement of settlements) {
      if (settlement.payee_id === userId) {
        balancesByGroup.set(settlement.group_id, balancesByGroup.get(settlement.group_id)! + settlement.amount);
      }
    }

    // Subtract settlements paid by user
    for (const settlement of settlements) {
      if (settlement.payer_id === userId) {
        balancesByGroup.set(settlement.group_id, balancesByGroup.get(settlement.group_id)! - settlement.amount);
      }
    }

    return balancesByGroup;
  } catch (error) {
    // Re-throw custom errors as-is
    if (error instanceof BalanceCalculationError) {
      throw error;
    }
    // Wrap unexpected errors
    throw new BalanceCalculationError("calculate balances", error instanceof Error ? error.message : "Unknown error");
  }
}
