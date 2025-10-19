import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

import { createExpenseFormSchema, type CreateExpenseFormValues } from "@/lib/schemas/expenseSchemas";
import { useExpenseForm } from "@/lib/hooks/useExpenseForm";
import { ExpenseBasicInfo } from "./ExpenseBasicInfo";
import { ExpenseSplitSection } from "./ExpenseSplitSection";
import type { GroupMemberSummaryDTO, GroupCurrencyDTO, ExpenseDTO } from "@/types";

interface ExpenseFormProps {
  groupId: string;
  groupMembers: GroupMemberSummaryDTO[];
  groupCurrencies: GroupCurrencyDTO[];
  currentUserId: string;
  onSubmit: (command: ExpenseDTO) => Promise<void>;
}

/**
 * Main expense creation form with all fields and split management
 */
export function ExpenseForm({ groupId, groupMembers, groupCurrencies, currentUserId, onSubmit }: ExpenseFormProps) {
  const {
    form,
    splitValidation,
    isSubmitting,
    submitError,
    fieldErrors,
    handleSubmit: submitExpense,
  } = useExpenseForm(groupMembers, groupCurrencies, currentUserId);

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
      {/* Basic Information */}
      <ExpenseBasicInfo
        form={form}
        groupMembers={groupMembers}
        groupCurrencies={groupCurrencies}
        currentUserId={currentUserId}
      />

      {/* Participants and Split */}
      <ExpenseSplitSection form={form} groupMembers={groupMembers} />

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
            {typeof formErrors.splits === "string" ? formErrors.splits : formErrors.splits.message}
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
