import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { CreateExpenseFormValues } from "../schemas/expenseSchemas";
import type { ExpenseTranscriptionResult, TranscriptionResultDTO, TranscriptionErrorDTO } from "../../types";

/**
 * Hook for integrating expense form with transcription functionality
 * Handles the logic of populating form from transcription results
 */
export function useExpenseFormIntegration(
  form: UseFormReturn<CreateExpenseFormValues>,
  onTranscriptionComplete?: (result: TranscriptionResultDTO) => void
) {
  const populateFromTranscription = useCallback(
    (data: ExpenseTranscriptionResult) => {
      // Validate required fields
      if (!data.description?.trim()) {
        throw new Error("Brak opisu w danych z transkrypcji");
      }

      if (!data.amount || data.amount <= 0) {
        throw new Error("Nieprawidłowa kwota w danych z transkrypcji");
      }

      if (!data.splits || data.splits.length === 0) {
        throw new Error("Brak podziału kosztów w danych z transkrypcji");
      }

      // Populate the form with transcription data
      form.setValue("description", data.description.trim(), { shouldValidate: true });
      form.setValue("amount", data.amount, { shouldValidate: true });
      form.setValue("currency_code", data.currency_code ?? undefined, { shouldValidate: true });
      form.setValue("expense_date", data.expense_date ?? undefined, { shouldValidate: true });
      form.setValue("payer_id", data.payer_id ?? undefined, { shouldValidate: true });
      form.setValue("splits", data.splits, { shouldValidate: true });

      // Trigger validation after a short delay to ensure values are set
      setTimeout(() => {
        form.trigger();
      }, 0);
    },
    [form]
  );

  const handleTranscriptionComplete = useCallback(
    (result: TranscriptionResultDTO, onTranscriptionError?: (error: TranscriptionErrorDTO) => void) => {
      try {
        populateFromTranscription(result.expense_data);
        // Call parent callback
        onTranscriptionComplete?.(result);
      } catch (error) {
        // Still call parent callback to show error
        if (onTranscriptionError) {
          onTranscriptionError({
            code: "FORM_POPULATION_ERROR",
            message: error instanceof Error ? error.message : "Błąd podczas wypełniania formularza",
          });
        }
      }
    },
    [populateFromTranscription, onTranscriptionComplete]
  );

  return { handleTranscriptionComplete, populateFromTranscription };
}
