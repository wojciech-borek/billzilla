import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import type {
  CreateExpenseFormValues,
  GroupMemberSummaryDTO,
  GroupCurrencyDTO,
  ExpenseTranscriptionResult,
} from "../../types";
import { validateTranscriptionData } from "../utils/expenseValidationUtils";
import { ExpenseFormError } from "../utils/errorHandling";

export interface ExpenseFormPopulationOptions {
  form: UseFormReturn<CreateExpenseFormValues>;
  groupMembers: GroupMemberSummaryDTO[];
  groupCurrencies: GroupCurrencyDTO[];
  defaultPayerId?: string;
  onSuccess?: () => void;
  onError?: (error: ExpenseFormError) => void;
}

/**
 * Hook for populating expense form with data from voice transcription
 * Handles validation, data transformation, and form population
 */
export function useExpenseFormPopulation(options: ExpenseFormPopulationOptions) {
  const { form, groupMembers, groupCurrencies, defaultPayerId, onSuccess, onError } = options;

  const populateFromTranscription = useCallback(
    (data: ExpenseTranscriptionResult) => {
      try {
        // Validate transcription data
        const transcriptionErrors = validateTranscriptionData(data);
        if (Object.keys(transcriptionErrors).length > 0) {
          const firstError = Object.values(transcriptionErrors)[0];
          throw new ExpenseFormError(firstError);
        }

        // Apply defaults for optional fields
        const currency_code = data.currency_code || groupCurrencies[0]?.code || "PLN";
        const expense_date = data.expense_date || new Date().toISOString().slice(0, 16);
        const payer_id = data.payer_id || defaultPayerId || groupMembers[0]?.profile_id;

        // Validate required fields are present (should be guaranteed by validateTranscriptionData)
        if (!data.splits || !data.description || !data.amount) {
          throw new ExpenseFormError("Brak wymaganych danych z transkrypcji");
        }

        // Filter valid splits (participants must be group members)
        const validSplits = data.splits.filter((split) =>
          groupMembers.some((member) => member.profile_id === split.profile_id)
        );

        if (validSplits.length === 0) {
          throw new ExpenseFormError("Żaden z uczestników nie należy do grupy");
        }

        // Validate currency exists in group
        const currencyExists = groupCurrencies.some((currency) => currency.code === currency_code);
        if (!currencyExists) {
          // Use default currency silently - could log this for debugging
        }

        // Populate form
        form.setValue("description", data.description.trim(), { shouldValidate: true });
        form.setValue("amount", data.amount, { shouldValidate: true });
        form.setValue("currency_code", currency_code, { shouldValidate: true });
        form.setValue("expense_date", expense_date, { shouldValidate: true });
        form.setValue("payer_id", payer_id, { shouldValidate: true });
        form.setValue("splits", validSplits, { shouldValidate: true });

        // Trigger validation after a short delay
        setTimeout(() => form.trigger(), 0);

        // Clear any existing errors and call success callback
        onSuccess?.();
      } catch (error) {
        const expenseError =
          error instanceof ExpenseFormError
            ? error
            : new ExpenseFormError("Błąd podczas wypełniania formularza z transkrypcji");

        onError?.(expenseError);
        throw expenseError;
      }
    },
    [form, groupMembers, groupCurrencies, defaultPayerId, onSuccess, onError]
  );

  return { populateFromTranscription };
}
