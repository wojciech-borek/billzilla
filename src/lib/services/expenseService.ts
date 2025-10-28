import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CreateExpenseCommand, ExpenseDTO } from "../../types";
import { createExpenseSchema, type CreateExpenseSchemaType } from "../schemas/expenseSchemas";
import { z } from "zod";

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

export class ExpenseValidationError extends Error {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ExpenseValidationError";
  }
}

export class ExpenseNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpenseNotFoundError";
  }
}

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
  private currencyConfig: any = null;
  private readonly supabase: SupabaseClient<Database>;
  private readonly groupId: string;
  private readonly userId: string;
  private readonly command: ValidatedExpenseCommand;

  constructor(supabase: SupabaseClient<Database>, groupId: string, userId: string, command: ValidatedExpenseCommand) {
    this.supabase = supabase;
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
      const expenseData = await this.createExpense();

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
      .eq("id", this.groupId)
      .eq("group_members.profile_id", this.userId)
      .eq("group_members.status", "active")
      .single();

    if (groupError || !groupData) {
      throw new ExpenseNotFoundError("Group not found or user is not an active member");
    }

    return groupData;
  }

  private async validateParticipants(groupData: any) {
    // Get all active group members
    const { data: groupMembers, error: membersError } = await this.supabase
      .from("group_members")
      .select("profile_id")
      .eq("group_id", this.groupId)
      .eq("status", "active");

    if (membersError || !groupMembers) {
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
    const currencyConfig = groupData.group_currencies?.find(
      (gc: any) => gc.currency_code === this.command.currency_code
    );
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
    const { data: expenseData, error: expenseInsertError } = await this.supabase
      .from("expenses")
      .insert({
        group_id: this.groupId,
        description: this.command.description,
        amount: this.command.amount,
        currency_code: this.command.currency_code,
        expense_date: this.command.expense_date,
        created_by: this.userId,
        payer_id: this.command.payer_id,
      })
      .select()
      .single();

    if (expenseInsertError || !expenseData) {
      throw new ExpenseValidationError("Failed to create expense");
    }

    this.expenseId = expenseData.id;
    return expenseData;
  }

  private async createExpenseSplits() {
    const splitInserts = this.command.splits.map((split) => ({
      expense_id: this.expenseId!,
      profile_id: split.profile_id,
      amount: split.amount,
    }));

    const { error: splitsInsertError } = await this.supabase.from("expense_splits").insert(splitInserts);

    if (splitsInsertError) {
      throw new ExpenseValidationError("Failed to create expense splits");
    }
  }

  private async fetchCompleteExpense(): Promise<ExpenseDTO> {
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
      .eq("id", this.expenseId!)
      .single();

    if (fetchError || !completeExpense) {
      throw new ExpenseValidationError("Failed to retrieve created expense");
    }

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
        const splitProfile = split.profiles as unknown as {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        };
        return {
          profile_id: split.profile_id,
          full_name: splitProfile.full_name,
          amount: split.amount,
        };
      }),
    };

    return expenseDTO;
  }

  private async rollbackExpense() {
    if (this.expenseId) {
      await this.supabase.from("expenses").delete().eq("id", this.expenseId);
    }
  }
}

export async function createExpense(
  supabase: SupabaseClient<Database>,
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
