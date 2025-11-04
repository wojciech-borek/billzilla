import { useQuery } from "@tanstack/react-query";
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth";
import type { ExpenseDTO, ExpenseSplit } from "@/types";

export interface UseExpenseOptions {
  expenseId: string;
  enabled?: boolean;
}

export function useExpense({ expenseId, enabled = true }: UseExpenseOptions) {
  const { supabase } = useSupabaseAuth();

  return useQuery({
    queryKey: ["expense", expenseId],
    queryFn: async (): Promise<ExpenseDTO> => {
      const { data, error } = await supabase
        .from("expenses")
        .select(
          `
          *,
          expense_splits (
            *,
            profiles (
              id,
              email,
              full_name
            )
          ),
          profiles!expenses_created_by_fkey (
            id,
            email,
            full_name,
            avatar_url
          )
        `
        )
        .eq("id", expenseId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch expense: ${error.message}`);
      }

      // Transform the data to match ExpenseDTO structure
      const expense: ExpenseDTO = {
        id: data.id,
        group_id: data.group_id,
        description: data.description,
        amount: data.amount,
        currency_code: data.currency_code,
        amount_in_base_currency: data.amount, // Will be calculated by the API if needed
        expense_date: data.expense_date,
        payer_id: data.payer_id,
        created_at: data.created_at,
        created_by: {
          id: data.profiles.id,
          full_name: data.profiles.full_name || "",
          avatar_url: data.profiles.avatar_url || null,
        },
        splits: data.expense_splits.map((split: ExpenseSplit & { profiles?: { full_name: string | null } }) => ({
          profile_id: split.profile_id,
          full_name: split.profiles?.full_name || null,
          amount: split.amount,
        })),
      };

      return expense;
    },
    enabled: enabled && !!expenseId,
  });
}
