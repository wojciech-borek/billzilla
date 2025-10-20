import { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  CreateExpenseCommand,
  ExpenseDTO,
  GroupMemberSummaryDTO,
  GroupCurrencyDTO,
  ErrorResponseDTO,
} from "../../types";
import { createExpenseFormSchema, type CreateExpenseFormValues } from "../schemas/expenseSchemas";

type SplitMethod = "equal" | "custom";

interface ExpenseFormState {
  isSubmitting: boolean;
  submitError: string | null;
  fieldErrors: Record<string, string> | null;
}

type UseExpenseFormResult = ExpenseFormState & {
  form: ReturnType<typeof useForm<CreateExpenseFormValues>>;
  splitValidation: {
    totalAmount: number;
    currentSum: number;
    remaining: number;
    isValid: boolean;
  };
  handleSubmit: (groupId: string) => Promise<ExpenseDTO>;
  populateFromTranscription: (data: CreateExpenseCommand) => void;
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
  initialData?: CreateExpenseCommand
): UseExpenseFormResult {
  const [state, setState] = useState<ExpenseFormState>({
    isSubmitting: false,
    submitError: null,
    fieldErrors: null,
  });

  // Initialize form with React Hook Form - don't validate on mount
  const form = useForm<CreateExpenseFormValues>({
    resolver: zodResolver(createExpenseFormSchema),
    mode: "onChange", // Only validate when user interacts
    defaultValues: initialData || {
      description: undefined,
      amount: undefined,
      currency_code: groupCurrencies[0]?.code || "PLN",
      expense_date: new Date().toISOString().slice(0, 16), // Current date/time in datetime-local format
      payer_id: defaultPayerId || undefined,
      splits: [],
    },
  });

  // Watch form values for validation
  const watchedAmount = form.watch("amount");
  const watchedSplits = form.watch("splits");

  // Split validation calculations - use form splits, not calculated splits
  const splitValidation = useMemo(() => {
    const totalAmount = watchedAmount || 0;
    const watchedSplitsArray = watchedSplits || [];
    const currentSum = watchedSplitsArray.reduce((sum, split) => sum + split.amount, 0);
    const remaining = Math.round((totalAmount - currentSum) * 100) / 100;
    const isValid = Math.abs(remaining) <= 0.01; // ±0.01 tolerance

    // Add validation error if sum doesn't match
    if (!isValid && watchedSplitsArray.length > 0) {
      setState((prev) => ({
        ...prev,
        fieldErrors: {
          ...prev.fieldErrors,
          splits: `Suma podziałów (${currentSum.toFixed(2)}) nie równa się kwocie całkowitej (${totalAmount.toFixed(2)}). Różnica: ${remaining > 0 ? "+" : ""}${remaining.toFixed(2)}`,
        },
      }));
    } else {
      setState((prev) => {
        const newFieldErrors = { ...prev.fieldErrors };
        delete newFieldErrors.splits;
        return {
          ...prev,
          fieldErrors: newFieldErrors,
        };
      });
    }

    return {
      totalAmount,
      currentSum,
      remaining,
      isValid,
    };
  }, [watchedAmount, watchedSplits]);

  const handleSubmit = useCallback(
    async (groupId: string): Promise<ExpenseDTO> => {
      setState((prev) => ({ ...prev, isSubmitting: true, submitError: null, fieldErrors: null }));

      try {
        // Validate all fields before submission
        const isValid = await form.trigger();
        if (!isValid) {
          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            submitError: "Wypełnij wszystkie wymagane pola poprawnie",
          }));
          throw new Error("Form validation failed");
        }

        // Get form data and prepare command
        const formData = form.getValues();

        // Additional validation for required fields (since schema uses optional)
        if (!formData.description?.trim()) {
          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            fieldErrors: { description: "Opis wydatku jest wymagany" },
          }));
          throw new Error("Description is required");
        }

        if (!formData.amount || formData.amount <= 0) {
          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            fieldErrors: { amount: "Kwota musi być większa od zera" },
          }));
          throw new Error("Amount is required");
        }

        if (!formData.currency_code) {
          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            fieldErrors: { currency_code: "Wybierz walutę" },
          }));
          throw new Error("Currency is required");
        }

        if (!formData.expense_date) {
          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            fieldErrors: { expense_date: "Data wydatku jest wymagana" },
          }));
          throw new Error("Expense date is required");
        }

        if (!formData.payer_id) {
          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            fieldErrors: { payer_id: "Wybierz płatnika" },
          }));
          throw new Error("Payer is required");
        }

        if (!formData.splits || formData.splits.length === 0) {
          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            fieldErrors: { splits: "Przynajmniej jeden uczestnik musi mieć przypisaną kwotę" },
          }));
          throw new Error("At least one split is required");
        }

        const command: CreateExpenseCommand = {
          description: formData.description.trim(),
          amount: formData.amount,
          currency_code: formData.currency_code,
          expense_date: formData.expense_date,
          payer_id: formData.payer_id,
          splits: formData.splits.filter((split) => split.amount > 0), // Only include splits with amounts > 0
        };

        const response = await fetch(`/api/groups/${groupId}/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData: ErrorResponseDTO = await response.json();

          if (response.status === 400) {
            setState((prev) => ({
              ...prev,
              isSubmitting: false,
              fieldErrors: (errorData.error.details as Record<string, string>) || null,
              submitError: errorData.error.details ? null : errorData.error.message || "Błąd walidacji danych",
            }));
            throw new Error(errorData.error.message || "Błąd walidacji danych");
          }

          const errorMessage =
            response.status === 401
              ? "Brak autoryzacji. Zaloguj się ponownie."
              : response.status === 404
                ? "Grupa nie została znaleziona lub nie jesteś jej członkiem."
                : response.status === 500
                  ? "Wystąpił błąd serwera. Spróbuj ponownie później."
                  : "Nie udało się utworzyć wydatku";

          setState((prev) => ({ ...prev, isSubmitting: false, submitError: errorMessage }));
          throw new Error(errorMessage);
        }

        const expenseDTO: ExpenseDTO = await response.json();
        setState((prev) => ({ ...prev, isSubmitting: false, submitError: null, fieldErrors: null }));

        return expenseDTO;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Nieznany błąd");
        if (!state.submitError) {
          setState((prev) => ({ ...prev, isSubmitting: false, submitError: error.message }));
        }
        throw error;
      }
    },
    [form]
  );

  // Populate form with data from voice transcription
  const populateFromTranscription = useCallback((data: CreateExpenseCommand) => {
    try {
      // Validate required fields
      if (!data.description?.trim()) {
        throw new Error("Brak opisu w danych z transkrypcji");
      }

      if (!data.amount || data.amount <= 0) {
        throw new Error("Nieprawidłowa kwota w danych z transkrypcji");
      }

      if (!data.currency_code) {
        throw new Error("Brak waluty w danych z transkrypcji");
      }

      if (!data.expense_date) {
        throw new Error("Brak daty w danych z transkrypcji");
      }

      if (!data.payer_id) {
        throw new Error("Brak płatnika w danych z transkrypcji");
      }

      if (!data.splits || data.splits.length === 0) {
        throw new Error("Brak podziału kosztów w danych z transkrypcji");
      }

      // Validate payer is a member of the group
      const payerExists = groupMembers.some(member => member.profile_id === data.payer_id);
      if (!payerExists) {
        throw new Error("Płatnik nie należy do grupy");
      }

      // Validate all split participants are members of the group
      for (const split of data.splits) {
        const memberExists = groupMembers.some(member => member.profile_id === split.profile_id);
        if (!memberExists) {
          throw new Error(`Uczestnik ${split.profile_id} nie należy do grupy`);
        }
      }

      // Validate currency is available in the group
      const currencyExists = groupCurrencies.some(currency => currency.code === data.currency_code);
      if (!currencyExists) {
        throw new Error(`Waluta ${data.currency_code} nie jest dostępna w grupie`);
      }

      // All validations passed - populate the form
      form.setValue('description', data.description);
      form.setValue('amount', data.amount);
      form.setValue('currency_code', data.currency_code);
      form.setValue('expense_date', data.expense_date);
      form.setValue('payer_id', data.payer_id);
      form.setValue('splits', data.splits);

      // Clear any existing errors
      setState(prev => ({
        ...prev,
        submitError: null,
        fieldErrors: null,
      }));

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Błąd podczas wypełniania formularza z transkrypcji';
      setState(prev => ({
        ...prev,
        submitError: message,
      }));
      throw error;
    }
  }, [form, groupMembers, groupCurrencies]);

  const reset = useCallback(() => {
    form.reset();
    setState({
      isSubmitting: false,
      submitError: null,
      fieldErrors: null,
    });
  }, [form]);

  return {
    ...state,
    form,
    splitValidation,
    handleSubmit,
    populateFromTranscription,
    reset,
  };
}
