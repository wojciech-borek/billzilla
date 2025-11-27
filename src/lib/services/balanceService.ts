/**
 * Balance service - handles business logic for balance calculations
 */

import type { MemberBalanceDTO } from "../../types";
import { BalanceRepository } from "./repositories/BalanceRepository";

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
 * Balance service - handles business logic for balance calculations
 */
export class BalanceService {
  constructor(private balanceRepository: BalanceRepository) {}

  /**
   * Calculates user's balance for each group in base currency
   *
   * Balance calculation formula:
   * Balance = (amounts paid by user) - (amounts owed by user) - (settlements received) + (settlements paid)
   * All amounts are converted to base currency using exchange rates
   *
   * @param userId - ID of the user whose balance to calculate
   * @param groupIds - Array of group IDs to calculate balances for
   * @returns Map of groupId to balance amount
   * @throws {BalanceCalculationError} If any data fetching operation fails
   */
  async calculateUserBalances(userId: string, groupIds: string[]): Promise<Map<string, number>> {
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
        this.balanceRepository.fetchUserExpenses(userId, groupIds),
        this.balanceRepository.fetchUserExpenseSplits(userId, groupIds),
        this.balanceRepository.fetchUserSettlements(userId, groupIds),
        this.balanceRepository.fetchExchangeRates(groupIds),
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
      for (const split of userSplits) {
        const expenseData = split.expenses;
        const groupId = expenseData?.group_id;
        const currencyCode = expenseData?.currency_code;
        const rate = exchangeRates.get(groupId)?.get(currencyCode) || 1.0;
        const amountInBase = split.amount * rate;
        const currentBalance = balancesByGroup.get(groupId) || 0;
        balancesByGroup.set(groupId, currentBalance - amountInBase);
      }

      // Subtract settlements received by user (others repay debt, so their owed amount decreases)
      for (const settlement of settlements) {
        if (settlement.payee_id === userId) {
          const currentBalance = balancesByGroup.get(settlement.group_id) || 0;
          balancesByGroup.set(settlement.group_id, currentBalance - settlement.amount);
        }
      }

      // Add settlements paid by user (user pays down debt; balance moves closer to zero)
      for (const settlement of settlements) {
        if (settlement.payer_id === userId) {
          const currentBalance = balancesByGroup.get(settlement.group_id) || 0;
          balancesByGroup.set(settlement.group_id, currentBalance + settlement.amount);
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
   * @param groupId - ID of the group to calculate balances for
   * @param requestingUserId - ID of the user making the request (for membership verification)
   * @returns Group balances with member balances and settlement suggestions
   * @throws {BalanceCalculationError} If calculation fails or user is not a member
   */
  async getGroupBalances(groupId: string, requestingUserId: string) {
    // First verify requesting user is member of the group
    const isMember = await this.balanceRepository.verifyGroupMembership(groupId, requestingUserId);
    if (!isMember) {
      throw new BalanceCalculationError("Group not found or user is not an active member");
    }

    // Get group details including base currency
    const group = await this.balanceRepository.fetchGroupBasic(groupId);

    // Get all active members
    const members = await this.balanceRepository.fetchActiveGroupMembers(groupId);

    // Calculate balances for each member
    const memberBalances = [];

    for (const member of members) {
      const userId = member.profile_id;

      try {
        const userBalances = await this.calculateUserBalances(userId, [groupId]);
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
    const suggestedSettlements = this.generateSettlementSuggestions(memberBalancesCopy);

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
  private generateSettlementSuggestions(memberBalances: MemberBalanceDTO[]) {
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
}
