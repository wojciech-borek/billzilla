import { useCallback } from "react";
import type { CreateExpenseCommand, ExpenseDTO, GroupMemberSummaryDTO, GroupCurrencyDTO } from "../../types";
import { filterValidSplits } from "../utils/expenseValidationUtils";
import { handleExpenseError, ExpenseFormError } from "../utils/errorHandling";
import { createClient } from "../../db/supabase.client";

export interface ExpenseSubmissionOptions {
  storedMode: string;
  storedExpenseId: string;
  groupMembers: GroupMemberSummaryDTO[];
  groupCurrencies: GroupCurrencyDTO[];
  onSuccess?: (expense: ExpenseDTO) => void;
  onError?: (error: ExpenseFormError) => void;
}

/**
 * Hook for handling expense form submission
 * Manages HTTP requests and response handling
 *
 * @param options - Submission configuration
 * @returns Submit function that handles the expense creation/update
 */
export function useExpenseSubmission(options: ExpenseSubmissionOptions) {
  const { storedMode, storedExpenseId, onSuccess, onError } = options;

  const submit = useCallback(
    async (groupId: string, formData: CreateExpenseCommand): Promise<ExpenseDTO> => {
      try {
        // Prepare the command with filtered splits
        const command: CreateExpenseCommand = {
          ...formData,
          description: formData.description.trim(),
          splits: filterValidSplits(formData.splits),
        };

        // Determine request details
        const isEdit = storedMode === "edit" && storedExpenseId;
        const url = isEdit ? `/api/expenses/${storedExpenseId}` : `/api/groups/${groupId}/expenses`;
        const method = isEdit ? "PATCH" : "POST";

        // Pobierz access token z Supabase
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Make the request
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const expenseError = handleExpenseError(response);
          onError?.(expenseError);
          throw expenseError;
        }

        const expenseDTO: ExpenseDTO = await response.json();
        onSuccess?.(expenseDTO);

        return expenseDTO;
      } catch (error) {
        const expenseError = handleExpenseError(error);
        onError?.(expenseError);
        throw expenseError;
      }
    },
    [storedMode, storedExpenseId, onSuccess, onError]
  );

  return { submit };
}
