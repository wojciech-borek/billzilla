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
import { validateExpenseFields, validateTranscriptionData } from "../utils/expenseValidationUtils";
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

  // Populate form with data from voice transcription
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
          // Use default currency silently
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

        // Clear any existing errors
        formState.setSubmitError(null);
        formState.setFieldErrors(null);
      } catch (error) {
        const message =
          error instanceof ExpenseFormError ? error.message : "Błąd podczas wypełniania formularza z transkrypcji";
        formState.setSubmitError(message);
        throw error;
      }
    },
    [form, groupMembers, groupCurrencies, defaultPayerId, formState]
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
    populateFromTranscription,
    reset,
  };
}
