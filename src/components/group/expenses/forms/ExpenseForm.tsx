import React from "react";

import { useExpenseForm } from "@/lib/hooks/useExpenseForm";
import { ExpenseFormHeader } from "./ExpenseFormHeader";
import { ExpenseFormContent } from "./ExpenseFormContent";
import { ExpenseFormFooter } from "./ExpenseFormFooter";
import type {
  GroupMemberSummaryDTO,
  GroupCurrencyDTO,
  ExpenseDTO,
  CreateExpenseCommand,
  TranscriptionResultDTO,
  TranscriptionErrorDTO,
} from "@/types";

interface ExpenseFormProps {
  groupId: string;
  groupMembers: GroupMemberSummaryDTO[];
  groupCurrencies: GroupCurrencyDTO[];
  currentUserId: string;
  onSubmit: (command: ExpenseDTO) => Promise<void>;
  initialData?: CreateExpenseCommand;
  isFromVoice?: boolean;
  hasLowConfidence?: boolean;
  onTranscriptionComplete?: (result: TranscriptionResultDTO) => void;
  onTranscriptionError?: (error: TranscriptionErrorDTO) => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
  expenseId?: string;
}

/**
 * Main expense creation form with all fields and split management
 */
export function ExpenseForm({
  groupId,
  groupMembers,
  groupCurrencies,
  currentUserId,
  onSubmit,
  initialData,
  isFromVoice = false,
  hasLowConfidence = false,
  onTranscriptionComplete,
  onTranscriptionError,
  isLoading = false,
  mode = "create",
  expenseId,
}: ExpenseFormProps) {
  console.log("ExpenseForm - called with mode:", mode, "expenseId:", expenseId);

  const {
    form,
    validation,
    isSubmitting,
    submitError,
    fieldErrors,
    handleSubmit: submitExpense,
    populateFromTranscription,
  } = useExpenseForm(groupMembers, groupCurrencies, currentUserId, initialData, mode, expenseId);

  const {
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  const handleTranscriptionComplete = (
    result: TranscriptionResultDTO,
    onTranscriptionError?: (error: TranscriptionErrorDTO) => void
  ) => {
    try {
      populateFromTranscription(result.expense_data);
      onTranscriptionComplete?.(result);
    } catch (error) {
      if (onTranscriptionError) {
        onTranscriptionError({
          code: "FORM_POPULATION_ERROR",
          message: error instanceof Error ? error.message : "Błąd podczas wypełniania formularza",
        });
      }
    }
  };

  const onFormSubmit = async () => {
    try {
      const expense = await submitExpense(groupId);
      await onSubmit(expense);
    } catch {
      // Error is handled in the hook
    }
  };

  const formErrors = { ...errors, ...fieldErrors };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <ExpenseFormHeader isFromVoice={isFromVoice} hasLowConfidence={hasLowConfidence} />

      <ExpenseFormContent
        form={form}
        groupId={groupId}
        groupMembers={groupMembers}
        groupCurrencies={groupCurrencies}
        currentUserId={currentUserId}
        hasLowConfidence={hasLowConfidence}
        onTranscriptionComplete={handleTranscriptionComplete}
        onTranscriptionError={onTranscriptionError}
        isLoading={isLoading}
      />

      <ExpenseFormFooter
        submitError={submitError}
        splitValidationError={
          formErrors.splits
            ? typeof formErrors.splits === "string"
              ? formErrors.splits
              : formErrors.splits?.message || "Błąd walidacji podziału"
            : undefined
        }
        isSubmitting={isSubmitting}
        isValid={isValid}
        splitValidationValid={validation.splitValidation.isValid}
      />
    </form>
  );
}
