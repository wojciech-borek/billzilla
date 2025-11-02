import { useState, useCallback } from "react";

export interface ExpenseFormState {
  isSubmitting: boolean;
  submitError: string | null;
  fieldErrors: Record<string, string> | null;
}

export interface ExpenseFormStateActions {
  setSubmitting: (isSubmitting: boolean) => void;
  setSubmitError: (error: string | null) => void;
  setFieldErrors: (errors: Record<string, string> | null) => void;
  setSuccess: () => void;
  reset: () => void;
}

export type UseExpenseFormStateResult = ExpenseFormState & ExpenseFormStateActions;

/**
 * Hook for managing expense form state (submission, errors)
 * Isolated from form logic for better testability and separation of concerns
 */
export function useExpenseFormState(): UseExpenseFormStateResult {
  const [state, setState] = useState<ExpenseFormState>({
    isSubmitting: false,
    submitError: null,
    fieldErrors: null,
  });

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState((prev) => ({ ...prev, isSubmitting }));
  }, []);

  const setSubmitError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, submitError: error }));
  }, []);

  const setFieldErrors = useCallback((errors: Record<string, string> | null) => {
    setState((prev) => ({ ...prev, fieldErrors: errors }));
  }, []);

  const setSuccess = useCallback(() => {
    setState({
      isSubmitting: false,
      submitError: null,
      fieldErrors: null,
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      submitError: null,
      fieldErrors: null,
    });
  }, []);

  return {
    ...state,
    setSubmitting,
    setSubmitError,
    setFieldErrors,
    setSuccess,
    reset,
  };
}
