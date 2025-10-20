import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mic, AlertTriangle } from "lucide-react";

import { createExpenseFormSchema, type CreateExpenseFormValues } from "@/lib/schemas/expenseSchemas";
import { useExpenseForm } from "@/lib/hooks/useExpenseForm";
import { ExpenseBasicInfo } from "./ExpenseBasicInfo";
import { ExpenseSplitSection } from "./ExpenseSplitSection";
import type { GroupMemberSummaryDTO, GroupCurrencyDTO, ExpenseDTO, CreateExpenseCommand, TranscriptionResultDTO, TranscriptionErrorDTO } from "@/types";

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
  isLoading = false
}: ExpenseFormProps) {
  const {
    form,
    splitValidation,
    isSubmitting,
    submitError,
    fieldErrors,
    handleSubmit: submitExpense,
  } = useExpenseForm(groupMembers, groupCurrencies, currentUserId, initialData);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  const onFormSubmit = async (data: CreateExpenseFormValues) => {
    try {
      const expense = await submitExpense(groupId);
      await onSubmit(expense);
    } catch (error) {
      // Error is handled in the hook
      console.error("Form submission error:", error);
    }
  };

  const formErrors = { ...errors, ...fieldErrors };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Voice input badges */}
      {isFromVoice && (
        <div className="flex justify-center gap-2 flex-wrap">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent border border-accent/30">
            <Mic className="h-3 w-3 mr-1" />
            Wypełnione głosem
          </div>
          {hasLowConfidence && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Niska pewność
            </div>
          )}
        </div>
      )}

      {/* Basic Information */}
      <ExpenseBasicInfo
        form={form}
        groupMembers={groupMembers}
        groupCurrencies={groupCurrencies}
        currentUserId={currentUserId}
        hasLowConfidence={hasLowConfidence}
        groupId={groupId}
        onTranscriptionComplete={onTranscriptionComplete}
        onTranscriptionError={onTranscriptionError}
        isLoading={isLoading}
      />

      {/* Participants and Split */}
      <ExpenseSplitSection form={form} groupMembers={groupMembers} hasLowConfidence={hasLowConfidence} />

      {/* Error Messages */}
      {submitError && (
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
          <p className="text-sm text-destructive font-medium">Błąd podczas tworzenia wydatku</p>
          <p className="text-sm text-destructive mt-1">{submitError}</p>
        </div>
      )}

      {/* Split validation error */}
      {formErrors.splits && (
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
          <p className="text-sm text-destructive font-medium">Błąd podziału</p>
          <p className="text-sm text-destructive mt-1">
            {typeof formErrors.splits === "string" ? formErrors.splits : (formErrors.splits as any)?.message || "Błąd walidacji podziału"}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={!isValid || isSubmitting || !splitValidation.isValid} className="min-w-[120px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Tworzenie...
            </>
          ) : (
            "Utwórz wydatek"
          )}
        </Button>
      </div>
    </form>
  );
}
