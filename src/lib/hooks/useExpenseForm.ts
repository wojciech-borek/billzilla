import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  CreateExpenseCommand,
  ExpenseDTO,
  GroupMemberSummaryDTO,
  GroupCurrencyDTO,
  ExpenseTranscriptionResult,
} from "../../types";
import { createExpenseFormSchema, type CreateExpenseFormValues } from "../schemas/expenseSchemas";
import { useExpenseFormState } from "./useExpenseFormState";
import { useExpenseValidation } from "./useExpenseValidation";
import { useExpenseSubmission } from "./useExpenseSubmission";
import { useExpenseFormPopulation } from "./useExpenseFormPopulation";
import { validateExpenseFields } from "../utils/expenseValidationUtils";
import { ExpenseFormError } from "../utils/errorHandling";

type UseExpenseFormResult = ReturnType<typeof useExpenseFormState> & {
  form: ReturnType<typeof useForm<CreateExpenseFormValues>>;
  validation: ReturnType<typeof useExpenseValidation>;
  handleSubmit: (groupId: string) => Promise<ExpenseDTO>;
  populateFromTranscription: (data: ExpenseTranscriptionResult) => void;
  reset: () => void;
};

/**
 * Hook for managing expense creation form with split calculations
 *
 * @param groupMembers - List of active group members
 * @param groupCurrencies - List of available currencies in the group
 * @param defaultPayerId - Default payer ID (usually current user)
 * @param initialData - Initial data from voice transcription (optional)
 */
export function useExpenseForm(
  groupMembers: GroupMemberSummaryDTO[],
  groupCurrencies: GroupCurrencyDTO[],
  defaultPayerId?: string,
  initialData?: CreateExpenseCommand,
  mode?: "create" | "edit",
  expenseId?: string
): UseExpenseFormResult {
  // Store mode and expenseId in state to prevent re-initialization issues
  const [storedMode] = useState(mode);
  const [storedExpenseId] = useState(expenseId);

  // State management
  const formState = useExpenseFormState();

  // Initialize form with React Hook Form - don't validate on mount
  const form = useForm<CreateExpenseFormValues>({
    resolver: zodResolver(createExpenseFormSchema),
    mode: "onChange", // Only validate when user interacts
    defaultValues: initialData || {
      description: "",
      amount: 0,
      currency_code: groupCurrencies[0]?.code || "PLN",
      expense_date: new Date().toISOString().slice(0, 16), // Current date/time in datetime-local format
      payer_id: defaultPayerId || "",
      splits: [],
    },
  });

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData, { keepDefaultValues: false });
    } else {
      // Reset to defaults for create mode
      form.reset({
        description: "",
        amount: 0,
        currency_code: groupCurrencies[0]?.code || "PLN",
        expense_date: new Date().toISOString().slice(0, 16),
        payer_id: defaultPayerId || "",
        splits: [],
      });
    }
  }, [initialData, form, groupCurrencies, defaultPayerId]);

  // Watch form values for validation
  const watchedValues = form.watch();

  // Validation
  const validation = useExpenseValidation(watchedValues);

  // Submission
  const submission = useExpenseSubmission({
    storedMode: storedMode || "create",
    storedExpenseId: storedExpenseId || "",
    groupMembers,
    groupCurrencies,
    onSuccess: () => formState.setSuccess(),
    onError: (error) => {
      if (error.field) {
        formState.setFieldErrors({ [error.field]: error.message });
      } else {
        formState.setSubmitError(error.message);
      }
    },
  });

  // Population from transcription
  const population = useExpenseFormPopulation({
    form,
    groupMembers,
    groupCurrencies,
    defaultPayerId,
    onSuccess: () => {
      formState.setSubmitError(null);
      formState.setFieldErrors(null);
    },
    onError: (error) => {
      formState.setSubmitError(error.message);
    },
  });

  const handleSubmit = useCallback(
    async (groupId: string): Promise<ExpenseDTO> => {
      formState.setSubmitting(true);
      formState.setSubmitError(null);
      formState.setFieldErrors(null);

      try {
        // React Hook Form validation
        const isFormValid = await form.trigger();
        if (!isFormValid) {
          throw new ExpenseFormError("Wypełnij wszystkie wymagane pola poprawnie");
        }

        // Additional business logic validation
        const formData = form.getValues();
        const fieldErrors = validateExpenseFields(formData);
        if (Object.keys(fieldErrors).length > 0) {
          throw new ExpenseFormError("Walidacja nie powiodła się", Object.keys(fieldErrors)[0]);
        }

        // Submit the expense
        return await submission.submit(groupId, formData as CreateExpenseCommand);
      } catch (error) {
        const expenseError =
          error instanceof ExpenseFormError ? error : new ExpenseFormError("Wystąpił nieznany błąd podczas wysyłania");

        if (expenseError.field) {
          formState.setFieldErrors({ [expenseError.field]: expenseError.message });
        } else {
          formState.setSubmitError(expenseError.message);
        }

        throw expenseError;
      } finally {
        formState.setSubmitting(false);
      }
    },
    [form, formState, submission]
  );

  const reset = useCallback(() => {
    form.reset();
    formState.reset();
  }, [form, formState]);

  return {
    ...formState,
    form,
    validation,
    handleSubmit,
    populateFromTranscription: population.populateFromTranscription,
    reset,
  };
}
