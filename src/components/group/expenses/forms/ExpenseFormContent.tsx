import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { ExpenseBasicInfo } from "./ExpenseBasicInfo";
import { ExpenseSplitSection } from "./ExpenseSplitSection";
import type { CreateExpenseFormValues } from "@/lib/schemas/expenseSchemas";
import type {
  GroupMemberSummaryDTO,
  GroupCurrencyDTO,
  TranscriptionResultDTO,
  TranscriptionErrorDTO,
} from "@/types";

interface ExpenseFormContentProps {
  form: UseFormReturn<CreateExpenseFormValues>;
  groupId: string;
  groupMembers: GroupMemberSummaryDTO[];
  groupCurrencies: GroupCurrencyDTO[];
  currentUserId: string;
  hasLowConfidence?: boolean;
  onTranscriptionComplete?: (result: TranscriptionResultDTO) => void;
  onTranscriptionError?: (error: TranscriptionErrorDTO) => void;
  isLoading?: boolean;
}

/**
 * Main content component for expense form containing all form sections
 */
export function ExpenseFormContent({
  form,
  groupId,
  groupMembers,
  groupCurrencies,
  currentUserId,
  hasLowConfidence = false,
  onTranscriptionComplete,
  onTranscriptionError,
  isLoading = false,
}: ExpenseFormContentProps) {
  return (
    <div className="space-y-6">
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
      <ExpenseSplitSection
        form={form}
        groupMembers={groupMembers}
        hasLowConfidence={hasLowConfidence}
      />
    </div>
  );
}
