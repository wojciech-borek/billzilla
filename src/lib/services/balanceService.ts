/**
 * Balance service - handles business logic for balance calculations
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { MemberBalanceDTO } from "../../types";

interface ExpenseSplitWithExpense {
  amount: number;
  expense_id: string;
  expenses: {
    group_id: string;
    currency_code: string;
  };
}

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
async function fetchUserExpenses(supabase: SupabaseClient, userId: string, groupIds: string[]) {
  const { data: userExpenses, error: expensesError } = await supabase
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
 * Fetches expense splits for user in specified groups
 */
async function fetchUserExpenseSplits(supabase: SupabaseClient, userId: string, groupIds: string[]) {
  // First get all expenses for the specified groups
  const { data: expenses, error: expensesError } = await supabase
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
  const { data: userSplits, error: splitsError } = await supabase
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
 * Fetches settlements involving user in specified groups
 */
async function fetchUserSettlements(supabase: SupabaseClient, userId: string, groupIds: string[]) {
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
  supabase: SupabaseClient,
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
    const groupRates = exchangeRates.get(gc.group_id);
    if (groupRates) {
      groupRates.set(gc.currency_code, gc.exchange_rate);
    }
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
  supabase: SupabaseClient,
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
      const currentBalance = balancesByGroup.get(expense.group_id) || 0;
      balancesByGroup.set(expense.group_id, currentBalance + amountInBase);
    }

    // Subtract amounts owed by user (converted to base currency)
    for (const split of userSplits as ExpenseSplitWithExpense[]) {
      const expenseData = split.expenses;
      const groupId = expenseData?.group_id;
      const currencyCode = expenseData?.currency_code;
      const rate = exchangeRates.get(groupId)?.get(currencyCode) || 1.0;
      const amountInBase = split.amount * rate;
      const currentBalance = balancesByGroup.get(groupId) || 0;
      balancesByGroup.set(groupId, currentBalance - amountInBase);
    }

    // Add settlements received by user
    for (const settlement of settlements) {
      if (settlement.payee_id === userId) {
        const currentBalance = balancesByGroup.get(settlement.group_id) || 0;
        balancesByGroup.set(settlement.group_id, currentBalance + settlement.amount);
      }
    }

    // Subtract settlements paid by user
    for (const settlement of settlements) {
      if (settlement.payer_id === userId) {
        const currentBalance = balancesByGroup.get(settlement.group_id) || 0;
        balancesByGroup.set(settlement.group_id, currentBalance - settlement.amount);
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

/**
 * Calculates balances and settlement suggestions for all members of a group
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group to calculate balances for
 * @param requestingUserId - ID of the user making the request (for membership verification)
 * @returns Group balances with member balances and settlement suggestions
 * @throws {BalanceCalculationError} If calculation fails or user is not a member
 */
export async function getGroupBalances(supabase: SupabaseClient, groupId: string, requestingUserId: string) {
  // First verify requesting user is member of the group
  const { data: membershipCheck, error: membershipError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("profile_id", requestingUserId)
    .eq("status", "active")
    .single();

  if (membershipError || !membershipCheck) {
    throw new BalanceCalculationError("Group not found or user is not an active member");
  }

  // Get group details including base currency
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, name, base_currency_code")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new BalanceCalculationError("Group not found");
  }

  // Get all active members
  const { data: allMembers, error: allMembersError } = await supabase
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

  // No additional error check needed - already handled above

  if (!members || members.length === 0) {
    throw new BalanceCalculationError("Group has no active members");
  }

  // Calculate balances for each member
  const memberBalances = [];

  for (const member of members) {
    const userId = member.profile_id;

    try {
      const userBalances = await calculateUserBalances(supabase, userId, [groupId]);
      const balance = userBalances.get(groupId) || 0;

      memberBalances.push({
        profile_id: userId,
        full_name: member.profiles?.full_name || null,
        avatar_url: member.profiles?.avatar_url || null,
        balance: balance,
        status: member.status,
      });
    } catch (error) {
      const memberName = member.profiles?.full_name || userId;
      console.error(`Error calculating balance for ${memberName}:`, error);
      memberBalances.push({
        profile_id: userId,
        full_name: member.profiles?.full_name || null,
        avatar_url: member.profiles?.avatar_url || null,
        balance: 0, // Default to 0 on error
        status: member.status,
      });
    }
  }

  // Generate settlement suggestions using simplified algorithm
  // Create a copy of memberBalances to avoid modifying the original data
  const memberBalancesCopy = memberBalances.map((member) => ({ ...member }));
  const suggestedSettlements = generateSettlementSuggestions(memberBalancesCopy);

  // Check balance consistency - all balances should sum to approximately 0
  const totalBalance = memberBalances.reduce((sum, member) => sum + member.balance, 0);
  if (Math.abs(totalBalance) > 0.01) {
    console.warn(`WARNING: Balance sum is ${totalBalance}, which indicates data inconsistency!`);
  }

  return {
    group_id: groupId,
    base_currency_code: group.base_currency_code,
    calculated_at: new Date().toISOString(),
    member_balances: memberBalances,
    suggested_settlements: suggestedSettlements,
  };
}

/**
 * Generate settlement suggestions using a simplified algorithm
 * This is a basic implementation - a more sophisticated algorithm could minimize transaction count
 */
function generateSettlementSuggestions(memberBalances: MemberBalanceDTO[]) {
  const settlements = [];

  // Sort by balance: most negative (owes money) first, then most positive (is owed money)
  const sortedBalances = [...memberBalances].sort((a, b) => a.balance - b.balance);

  let i = 0; // Pointer for debtors (negative balances)
  let j = sortedBalances.length - 1; // Pointer for creditors (positive balances)

  while (i < j) {
    const debtor = sortedBalances[i];
    const creditor = sortedBalances[j];

    // Skip if debtor doesn't owe money or creditor is not owed money
    if (debtor.balance >= 0) {
      i++;
      continue;
    }
    if (creditor.balance <= 0) {
      j--;
      continue;
    }

    // Calculate settlement amount (minimum of what debtor owes and creditor is owed)
    const settlementAmount = Math.min(Math.abs(debtor.balance), creditor.balance);

    if (settlementAmount > 0.01) {
      // Only suggest settlements > 1 cent
      settlements.push({
        from: {
          profile_id: debtor.profile_id,
          full_name: debtor.full_name,
        },
        to: {
          profile_id: creditor.profile_id,
          full_name: creditor.full_name,
        },
        amount: settlementAmount,
      });
    }

    // Update balances
    debtor.balance += settlementAmount;
    creditor.balance -= settlementAmount;
  }

  return settlements;
}
