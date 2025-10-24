import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CreateExpenseCommand, ExpenseDTO } from "../../types";

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

export async function createExpense(
  supabase: SupabaseClient<Database>,
  groupId: string,
  userId: string,
  command: CreateExpenseCommand
): Promise<ExpenseDTO> {
  // Step 1: Verify user is a member of the group and get group info
  const { data: groupData, error: groupError } = await supabase
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
    throw new ExpenseNotFoundError("Group not found or user is not an active member");
  }

  // Step 2: Get all active group members for validation
  const { data: groupMembers, error: membersError } = await supabase
    .from("group_members")
    .select("profile_id")
    .eq("group_id", groupId)
    .eq("status", "active");

  if (membersError || !groupMembers) {
    throw new ExpenseValidationError("Could not verify group membership");
  }

  const activeMemberIds = new Set(groupMembers.map((m) => m.profile_id));

  // Step 3: Validate payer is an active member (can be different from creator)
  if (!activeMemberIds.has(command.payer_id)) {
    throw new ExpenseValidationError("Payer must be an active member of the group");
  }

  // Step 4: Validate all split participants are active members
  for (const split of command.splits) {
    if (!activeMemberIds.has(split.profile_id)) {
      throw new ExpenseValidationError(`Split participant ${split.profile_id} is not an active member of the group`);
    }
  }

  // Step 5: Validate currency is configured for the group
  const currencyConfig = groupData.group_currencies?.find((gc) => gc.currency_code === command.currency_code);

  if (!currencyConfig) {
    throw new ExpenseValidationError(`Currency ${command.currency_code} is not configured for this group`);
  }

  // Step 6: Calculate amount in base currency
  const amountInBaseCurrency = Math.round(command.amount * currencyConfig.exchange_rate * 100) / 100;

  // Step 7: Begin transaction-like operations
  // Insert expense
  const { data: expenseData, error: expenseInsertError } = await supabase
    .from("expenses")
    .insert({
      group_id: groupId,
      description: command.description,
      amount: command.amount,
      currency_code: command.currency_code,
      expense_date: command.expense_date,
      created_by: userId,
      payer_id: command.payer_id,
    })
    .select()
    .single();

  if (expenseInsertError || !expenseData) {
    throw new ExpenseValidationError("Failed to create expense");
  }

  // Step 8: Insert expense splits
  const splitInserts = command.splits.map((split) => ({
    expense_id: expenseData.id,
    profile_id: split.profile_id,
    amount: split.amount,
  }));

  const { error: splitsInsertError } = await supabase.from("expense_splits").insert(splitInserts);

  if (splitsInsertError) {
    // Clean up the expense that was created
    await supabase.from("expenses").delete().eq("id", expenseData.id);
    throw new ExpenseValidationError("Failed to create expense splits");
  }

  // Step 9: Fetch the complete expense with enriched data
  const { data: completeExpense, error: fetchError } = await supabase
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
    .eq("id", expenseData.id)
    .single();

  if (fetchError || !completeExpense) {
    throw new ExpenseValidationError("Failed to retrieve created expense");
  }

  // Step 10: Transform to DTO format
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
