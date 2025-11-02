import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateExpenseCommand,
  ExpenseDTO,
  PaginatedResponse,
  ExpenseListItemDTO,
  ExpenseSplit,
} from "../../types";
import { z } from "zod";
import { getGroupCurrencies } from "./groupService";

// Type definitions for better type safety
interface GroupMembershipData {
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
}

interface CurrencyConfig {
  currency_code: string;
  exchange_rate: number;
}

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

// Import refactored components
import { ExpenseRepository } from "./repositories/ExpenseRepository";
import {
  ExpenseValidationError,
  ExpenseAccessError,
  ExpenseTransactionError,
  ExpenseDataError,
} from "./errors/expenseErrors";

// Re-export error classes for backward compatibility
export { ExpenseValidationError, ExpenseAccessError, ExpenseTransactionError, ExpenseDataError };

// Schema for basic format validation (no business rules)
const basicExpenseValidationSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must not exceed 500 characters")
    .trim(),
  amount: z
    .number()
    .positive("Amount must be positive")
    .refine(
      (val) => {
        const decimalPlaces = (val.toString().split(".")[1] || "").length;
        return decimalPlaces <= 2;
      },
      { message: "Amount must have at most 2 decimal places" }
    ),
  currency_code: z
    .string()
    .length(3, "Currency code must be exactly 3 characters")
    .regex(/^[A-Z]{3}$/, "Currency code must be 3 uppercase letters (ISO 4217 format)")
    .trim(),
  expense_date: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date.toISOString().startsWith(val.slice(0, 10));
  }, "Invalid date format. Expected valid date-time string"),
  payer_id: z.string().uuid("Invalid payer ID format"),
  splits: z
    .array(
      z.object({
        profile_id: z.string().uuid("Invalid profile ID format"),
        amount: z
          .number()
          .min(0, "Split amount cannot be negative")
          .refine(
            (val) => {
              const decimalPlaces = (val.toString().split(".")[1] || "").length;
              return decimalPlaces <= 2;
            },
            { message: "Split amount must have at most 2 decimal places" }
          ),
      })
    )
    .min(1, "At least one split is required"),
});

type BasicExpenseValidationType = z.infer<typeof basicExpenseValidationSchema>;

/**
 * Command class for creating expenses with basic format validation
 */
export class ValidatedExpenseCommand {
  public readonly validatedData: BasicExpenseValidationType;

  constructor(data: CreateExpenseCommand, skipValidation = false) {
    if (skipValidation) {
      // For testing purposes, allow bypassing validation
      this.validatedData = data as BasicExpenseValidationType;
    } else {
      try {
        this.validatedData = basicExpenseValidationSchema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ExpenseValidationError(
            "Invalid expense data format",
            error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            }))
          );
        }
        throw new ExpenseValidationError("Validation failed");
      }
    }
  }

  get description(): string {
    return this.validatedData.description;
  }

  get amount(): number {
    return this.validatedData.amount;
  }

  get currency_code(): string {
    return this.validatedData.currency_code;
  }

  get expense_date(): string {
    return this.validatedData.expense_date;
  }

  get payer_id(): string {
    return this.validatedData.payer_id;
  }

  get splits(): { profile_id: string; amount: number }[] {
    return this.validatedData.splits;
  }
}

/**
 * Unit of Work pattern for expense creation transactions
 * Manages the creation of expense and related data atomically
 */
export class ExpenseUnitOfWork {
  private expenseId: string | null = null;
  private currencyConfig: CurrencyConfig | null = null;
  private readonly repository: ExpenseRepository;
  private readonly groupId: string;
  private readonly userId: string;
  private readonly command: ValidatedExpenseCommand;

  constructor(supabase: SupabaseClient, groupId: string, userId: string, command: ValidatedExpenseCommand) {
    this.repository = new ExpenseRepository(supabase);
    this.groupId = groupId;
    this.userId = userId;
    this.command = command;
  }

  /**
   * Executes the complete expense creation transaction
   */
  async execute(): Promise<ExpenseDTO> {
    try {
      // Validate group membership and get group data
      const groupData = await this.validateGroupMembership();

      // Validate participants and currency
      await this.validateParticipants(groupData);

      // Create expense
      await this.createExpense();

      // Create expense splits
      await this.createExpenseSplits();

      // Fetch complete expense with related data
      return await this.fetchCompleteExpense();
    } catch (error) {
      // Rollback: if expense was created but splits failed, clean it up
      if (this.expenseId) {
        await this.rollbackExpense();
      }
      throw error;
    }
  }

  private async validateGroupMembership() {
    try {
      return await this.repository.fetchGroupMembershipAndCurrencies(this.groupId, this.userId);
    } catch {
      throw new ExpenseAccessError();
    }
  }

  private async validateParticipants(groupData: GroupMembershipData) {
    // Get all active group members using repository
    const groupMembers = await this.repository.fetchActiveGroupMembers(this.groupId);
    if (!groupMembers) {
      throw new ExpenseValidationError("Could not verify group membership");
    }
    const activeMemberIds = new Set(groupMembers.map((m) => m.profile_id));

    // Validate payer is an active member
    if (!activeMemberIds.has(this.command.payer_id)) {
      throw new ExpenseValidationError("Payer must be an active member of the group");
    }

    // Validate all split participants are active members
    for (const split of this.command.splits) {
      if (!activeMemberIds.has(split.profile_id)) {
        throw new ExpenseValidationError(`Split participant ${split.profile_id} is not an active member of the group`);
      }
    }

    // Validate currency is configured for the group
    const currencyConfig = groupData.group_currencies?.find((gc) => gc.currency_code === this.command.currency_code);
    if (!currencyConfig) {
      throw new ExpenseValidationError(`Currency ${this.command.currency_code} is not configured for this group`);
    }

    // Validate business rules: sum of splits equals total amount (with ±0.01 tolerance)
    const splitsSum = this.command.splits.reduce((sum, split) => sum + split.amount, 0);
    const difference = Math.abs(splitsSum - this.command.amount);
    if (difference > 0.01) {
      throw new ExpenseValidationError("Sum of splits must equal the total amount (tolerance ±0.01)");
    }

    // Validate business rules: no duplicate profile_ids in splits
    const profileIds = this.command.splits.map((split) => split.profile_id);
    const uniqueProfileIds = new Set(profileIds);
    if (profileIds.length !== uniqueProfileIds.size) {
      throw new ExpenseValidationError("Duplicate profile_id found in splits. Each participant can only appear once");
    }

    this.currencyConfig = currencyConfig;
    return currencyConfig;
  }

  private async createExpense() {
    try {
      const expenseData = await this.repository.createExpense({
        group_id: this.groupId,
        description: this.command.description,
        amount: this.command.amount,
        currency_code: this.command.currency_code,
        expense_date: this.command.expense_date,
        created_by: this.userId,
        payer_id: this.command.payer_id,
      });

      this.expenseId = expenseData.id;
      return expenseData;
    } catch {
      throw new ExpenseTransactionError("Failed to create expense");
    }
  }

  private async createExpenseSplits() {
    if (!this.expenseId) {
      throw new ExpenseTransactionError("Expense ID not set");
    }

    try {
      const splitInserts = this.command.splits.map((split) => ({
        expense_id: this.expenseId,
        profile_id: split.profile_id,
        amount: split.amount,
      }));

      await this.repository.createExpenseSplits(splitInserts);
    } catch {
      throw new ExpenseTransactionError("Failed to create expense splits");
    }
  }

  private async fetchCompleteExpense(): Promise<ExpenseDTO> {
    if (!this.expenseId) {
      throw new ExpenseDataError("fetch created expense", "Expense ID not set");
    }

    try {
      const completeExpense = (await this.repository.fetchCompleteExpense(this.expenseId)) as CompleteExpenseData;

      // Calculate amount in base currency using the currency config from validation
      const amountInBaseCurrency = this.currencyConfig
        ? Math.round(this.command.amount * this.currencyConfig.exchange_rate * 100) / 100
        : this.command.amount;

      // Transform to DTO format
      const createdByProfile = completeExpense.profiles as unknown as {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
      };

      const expenseDTO: ExpenseDTO = {
        id: completeExpense.id,
        group_id: completeExpense.group_id,
        payer_id: completeExpense.payer_id,
        description: completeExpense.description,
        amount: completeExpense.amount,
        currency_code: completeExpense.currency_code,
        expense_date: completeExpense.expense_date,
        created_at: completeExpense.created_at,
        amount_in_base_currency: amountInBaseCurrency,
        created_by: {
          id: createdByProfile.id,
          full_name: createdByProfile.full_name ?? "",
          avatar_url: createdByProfile.avatar_url ?? null,
        },
        splits: completeExpense.expense_splits.map((split) => {
          return {
            profile_id: split.profile_id,
            full_name: split.profiles.full_name,
            amount: split.amount,
          };
        }),
      };

      return expenseDTO;
    } catch (error) {
      throw new ExpenseDataError("retrieve created expense", error instanceof Error ? error.message : "Unknown error");
    }
  }

  private async rollbackExpense() {
    if (this.expenseId) {
      await this.repository.deleteExpense(this.expenseId);
    }
  }
}

export async function createExpense(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
  command: CreateExpenseCommand,
  skipValidation = false
): Promise<ExpenseDTO> {
  // Create and validate command
  const validatedCommand = new ValidatedExpenseCommand(command, skipValidation);

  // Execute transaction using Unit of Work pattern
  const unitOfWork = new ExpenseUnitOfWork(supabase, groupId, userId, validatedCommand);
  return await unitOfWork.execute();
}

/**
 * Get a single expense with full details
 */
export async function getExpense(
  supabase: SupabaseClient,
  groupId: string,
  expenseId: string,
  userId: string
): Promise<ExpenseDTO> {
  // Input validation
  if (!groupId) {
    throw new ExpenseDataError("get expense", "Group ID is required");
  }
  if (!expenseId) {
    throw new ExpenseDataError("get expense", "Expense ID is required");
  }
  if (!userId) {
    throw new ExpenseDataError("get expense", "User ID is required");
  }

  const repository = new ExpenseRepository(supabase);

  try {
    // Verify user has access to the group
    await repository.fetchGroupMembershipAndCurrencies(groupId, userId);

    // Fetch complete expense data
    const completeExpense = await repository.fetchCompleteExpense(expenseId);

    if (!completeExpense) {
      throw new ExpenseDataError("get expense", "Expense not found");
    }

    // Verify expense belongs to the requested group
    if (completeExpense.group_id !== groupId) {
      throw new ExpenseAccessError("Expense does not belong to this group");
    }

    // Get group currencies for conversion
    const groupData = await repository.fetchGroupMembershipAndCurrencies(groupId, userId);
    const baseCurrency = groupData.group_currencies.find((c) => c.currency_code === groupData.base_currency_code);

    if (!baseCurrency) {
      throw new ExpenseDataError("get expense", "Group base currency not found");
    }

    // Find exchange rate for this expense's currency
    const exchangeRate =
      groupData.group_currencies.find((c) => c.currency_code === completeExpense.currency_code)?.exchange_rate || 1.0;

    // Convert amount to base currency
    const amountInBaseCurrency = Math.round(completeExpense.amount * exchangeRate * 100) / 100;

    // Transform to DTO format
    const expenseDTO: ExpenseDTO = {
      id: completeExpense.id,
      group_id: completeExpense.group_id,
      payer_id: completeExpense.payer_id,
      description: completeExpense.description,
      amount: completeExpense.amount,
      currency_code: completeExpense.currency_code,
      expense_date: completeExpense.expense_date,
      created_at: completeExpense.created_at,
      amount_in_base_currency: amountInBaseCurrency,
      created_by: {
        id: completeExpense.profiles.id,
        full_name: completeExpense.profiles.full_name || "Użytkownik",
        avatar_url: completeExpense.profiles.avatar_url,
      },
      splits: completeExpense.expense_splits.map((split) => ({
        profile_id: split.profile_id,
        full_name: split.profiles?.full_name || null,
        amount: split.amount,
      })),
    };

    return expenseDTO;
  } catch (error) {
    // Re-throw custom errors
    if (error instanceof ExpenseDataError || error instanceof ExpenseAccessError) {
      throw error;
    }
    // Wrap unexpected errors
    throw new ExpenseDataError("get expense", error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Get paginated list of expenses for a group
 */
export async function getGroupExpenses(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    sort?: "created_at" | "expense_date" | "amount";
    order?: "asc" | "desc";
  }
): Promise<PaginatedResponse<ExpenseListItemDTO>> {
  const { limit = 20, offset = 0, sort = "created_at", order = "desc" } = options || {};

  // First verify user is member of the group
  const { data: membershipCheck, error: membershipError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("profile_id", userId)
    .eq("status", "active")
    .single();

  if (membershipError || !membershipCheck) {
    throw new ExpenseAccessError("Group not found or user is not an active member");
  }

  // Get group currencies for amount conversion
  const groupCurrencies = await getGroupCurrencies(supabase, groupId, userId);
  const currencyMap = new Map(
    groupCurrencies.additional_currencies.concat(groupCurrencies.base_currency).map((gc) => [gc.code, gc.exchange_rate])
  );

  // Get total count for pagination
  const { count, error: countError } = await supabase
    .from("expenses")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  if (countError) {
    throw new Error(`Failed to get expense count: ${countError.message}`);
  }

  // Build the query for expenses with related data
  const query = supabase
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
    .order(sort, { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  const { data: expensesData, error: expensesError } = await query;

  if (expensesError) {
    throw new Error(`Failed to fetch expenses: ${expensesError.message}`);
  }

  // Transform the data to match ExpenseListItemDTO
  const expenses: ExpenseListItemDTO[] = (expensesData || []).map((expense) => {
    const exchangeRate = currencyMap.get(expense.currency_code) || 1;
    const amountInBaseCurrency = Math.round(expense.amount * exchangeRate * 100) / 100;

    return {
      id: expense.id,
      group_id: expense.group_id,
      description: expense.description,
      amount: expense.amount,
      currency_code: expense.currency_code,
      expense_date: expense.expense_date,
      created_at: expense.created_at,
      payer_id: expense.payer_id,
      amount_in_base_currency: amountInBaseCurrency,
      created_by: {
        id: expense.profiles.id,
        full_name: expense.profiles.full_name || "Użytkownik",
        avatar_url: expense.profiles.avatar_url,
      },
      splits: (expense.expense_splits || []).map(
        (split: ExpenseSplit & { profiles?: { id: string; full_name: string | null; avatar_url: string | null } }) => ({
          profile_id: split.profile_id,
          amount: split.amount,
          full_name: split.profiles?.full_name || null,
          avatar_url: split.profiles?.avatar_url || null,
        })
      ),
    };
  });

  return {
    data: expenses,
    total: count || 0,
    limit,
    offset,
  };
}

/**
 * Delete an expense
 */
export async function deleteExpense(supabase: SupabaseClient, expenseId: string, userId: string): Promise<void> {
  try {
    // First check if user can delete this expense (must be creator)
    const { data: expense, error: fetchError } = await supabase
      .from("expenses")
      .select("created_by, group_id")
      .eq("id", expenseId)
      .single();

    if (fetchError) {
      throw new ExpenseDataError("check expense ownership", fetchError.message);
    }

    if (!expense) {
      throw new ExpenseAccessError("Expense not found");
    }

    if (expense.created_by !== userId) {
      throw new ExpenseAccessError("Only the creator can delete this expense");
    }

    // Check if user is still a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("status")
      .eq("group_id", expense.group_id)
      .eq("profile_id", userId)
      .single();

    if (membershipError || !membership) {
      throw new ExpenseAccessError("User is not a member of this group");
    }

    if (membership.status !== "active") {
      throw new ExpenseAccessError("User must be an active member to delete expenses");
    }

    // Delete the expense (this will cascade to expense_splits)
    const repository = new ExpenseRepository(supabase);
    await repository.deleteExpense(expenseId);
  } catch (error) {
    if (error instanceof ExpenseValidationError || error instanceof ExpenseAccessError) {
      throw error;
    }
    throw new ExpenseDataError("delete expense", error instanceof Error ? error.message : "Unknown error");
  }
}
