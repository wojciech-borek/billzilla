import type { CreateSettlementCommand, SettlementDTO, PaginatedResponse } from "../../types";
import { BalanceRepository } from "./repositories/BalanceRepository";
import { SettlementRepository } from "./repositories/SettlementRepository";
import type { BalanceService } from "./balanceService";

export class SettlementError extends Error {
  constructor(
    message: string,
    public code = "SETTLEMENT_ERROR"
  ) {
    super(message);
    this.name = "SettlementError";
  }
}

/**
 * Settlement service - handles business logic for settlements
 */
export class SettlementService {
  private balanceService: BalanceService | null = null;

  constructor(
    private settlementRepository: SettlementRepository,
    private balanceRepository: BalanceRepository,
    balanceService?: BalanceService
  ) {
    if (balanceService) {
      this.balanceService = balanceService;
    }
  }

  /**
   * Validates if a settlement between two users is possible
   * Checks if payer owes money to payee and if the amount doesn't exceed the debt
   */
  private async validateSettlementPossibility(
    groupId: string,
    payerId: string,
    payeeId: string,
    amount: number
  ): Promise<void> {
    // Initialize balance service if needed
    if (!this.balanceService) {
      const { BalanceService } = await import("./balanceService");
      this.balanceService = new BalanceService(this.balanceRepository);
    }

    // Get group balances to check current debt relationship
    const groupBalances = await this.balanceService.getGroupBalances(groupId, payerId);

    const payerBalance = groupBalances.member_balances.find((b) => b.profile_id === payerId)?.balance || 0;
    const payeeBalance = groupBalances.member_balances.find((b) => b.profile_id === payeeId)?.balance || 0;

    // Calculate the debt from payer to payee
    // If payer balance is negative and payee balance is positive, payer owes payee
    // The maximum settlement amount is the minimum of what payer owes and payee is owed
    const payerOwes = Math.abs(Math.min(payerBalance, 0));
    const payeeOwed = Math.max(payeeBalance, 0);

    if (payerOwes === 0) {
      throw new SettlementError("No outstanding debt found between these users", "NO_DEBT");
    }

    if (payeeOwed === 0) {
      throw new SettlementError("Payee is not owed money in this group", "PAYEE_NOT_OWED");
    }

    const maxSettlementAmount = Math.min(payerOwes, payeeOwed);
    if (amount > maxSettlementAmount) {
      throw new SettlementError(
        `Settlement amount cannot exceed outstanding debt of ${maxSettlementAmount.toFixed(2)}`,
        "AMOUNT_TOO_HIGH"
      );
    }
  }

  /**
   * Creates a new settlement in a group
   *
   * Note: Settlements are always recorded in the group's base currency.
   * The balance calculation service (calculateUserBalances) treats settlements
   * as monetary transactions that affect balances without currency conversion,
   * since settlements represent actual cash transfers between group members.
   */
  async createSettlement(groupId: string, command: CreateSettlementCommand): Promise<SettlementDTO> {
    // 1. Defensive guard checks
    if (command.amount <= 0) {
      throw new SettlementError("Settlement amount must be positive", "INVALID_AMOUNT");
    }

    if (command.payer_id === command.payee_id) {
      throw new SettlementError("Payer and payee cannot be the same person", "SAME_PAYER_PAYEE");
    }

    // 2. Verify group membership for payer and payee
    await this.settlementRepository.verifyGroupMembers(groupId, [command.payer_id, command.payee_id]);

    // 3. Validate settlement possibility (business rules)
    await this.validateSettlementPossibility(groupId, command.payer_id, command.payee_id, command.amount);

    // 3. Create settlement
    return this.settlementRepository.createSettlement({
      group_id: groupId,
      payer_id: command.payer_id,
      payee_id: command.payee_id,
      amount: command.amount,
    });
  }

  /**
   * Lists settlements for a group
   */
  async listSettlements(
    groupId: string,
    options: {
      limit?: number;
      offset?: number;
      sort?: "date_desc" | "date_asc";
    } = {}
  ): Promise<PaginatedResponse<SettlementDTO>> {
    return this.settlementRepository.listSettlements(groupId, options);
  }
}
