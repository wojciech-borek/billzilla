import React from "react";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "./forms/ExpenseForm";
import type {
  GroupMemberSummaryDTO,
  GroupCurrencyDTO,
  ExpenseDTO,
  CreateExpenseCommand,
  TranscriptionResultDTO,
} from "@/types";

interface ExpenseModalContentProps {
  groupId: string;
  groupMembers: GroupMemberSummaryDTO[];
  groupCurrencies: GroupCurrencyDTO[];
  currentUserId: string;
  isLoading?: boolean;
  error?: string | null;
  transcriptionData: CreateExpenseCommand | null;
  isFromVoice: boolean;
  hasLowConfidence: boolean;
  onExpenseCreated: (expense: ExpenseDTO) => void;
  onTranscriptionComplete: (result: TranscriptionResultDTO) => void;
  onTranscriptionError: (error: { message: string }) => void;
  onClose: () => void;
  mode?: "create" | "edit";
  expenseId?: string;
  initialExpenseData?: CreateExpenseCommand;
}

export function ExpenseModalContent({
  groupId,
  groupMembers,
  groupCurrencies,
  currentUserId,
  isLoading = false,
  error = null,
  transcriptionData,
  isFromVoice,
  hasLowConfidence,
  onExpenseCreated,
  onTranscriptionComplete,
  onTranscriptionError,
  onClose,
  mode = "create",
  expenseId,
  initialExpenseData,
}: ExpenseModalContentProps) {
  if (isLoading) {
    return (
      <div className="px-6 py-4 bg-background max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Ładowanie danych grupy...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-4 bg-background max-h-[70vh] overflow-y-auto">
        <div className="text-center py-12">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button onClick={onClose} variant="ghost">
            Zamknij
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 bg-background max-h-[70vh] overflow-y-auto">
      <ExpenseForm
        groupId={groupId}
        groupMembers={groupMembers}
        groupCurrencies={groupCurrencies}
        currentUserId={currentUserId}
        onSubmit={onExpenseCreated}
        initialData={transcriptionData || initialExpenseData || undefined}
        isFromVoice={isFromVoice}
        hasLowConfidence={hasLowConfidence}
        onTranscriptionComplete={onTranscriptionComplete}
        onTranscriptionError={onTranscriptionError}
        isLoading={isLoading || !!error}
        mode={mode}
        expenseId={expenseId}
      />
    </div>
  );
}
