import React, { useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

import { useExpenseModalLogic } from "@/lib/hooks/useExpenseModalLogic";
import { useExpenseModalData } from "@/lib/hooks/useExpenseModalData";
import { ExpenseModalHeader } from "./ExpenseModalHeader";
import { ExpenseModalContent } from "./ExpenseModalContent";
import type {
  GroupMemberSummaryDTO,
  GroupCurrencyDTO,
  ExpenseDTO,
  TranscriptionResultDTO,
  CreateExpenseCommand,
} from "@/types";

interface ExpenseModalProps {
  mode: "create" | "edit";
  groupId: string;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onExpenseCreated?: (expense: ExpenseDTO) => void;
  onExpenseUpdated?: (expense: ExpenseDTO) => void;
  isLoading?: boolean;
  error?: string | null;
  // For edit mode
  expenseId?: string;
  initialExpenseData?: CreateExpenseCommand;
  // Group data (optional - will load if not provided)
  initialMembers?: GroupMemberSummaryDTO[];
  initialCurrencies?: GroupCurrencyDTO[];
}

export function ExpenseModal({
  mode,
  groupId,
  currentUserId,
  isOpen,
  onClose,
  onExpenseCreated,
  onExpenseUpdated,
  isLoading = false,
  error = null,
  expenseId,
  initialExpenseData,
  initialMembers = [],
  initialCurrencies = [],
}: ExpenseModalProps) {
  // Load group data using custom hook
  const {
    members: groupMembers,
    currencies: groupCurrencies,
    isLoading: isGroupDataLoading,
    error: groupDataError,
  } = useExpenseModalData({
    groupId,
    isOpen,
    initialMembers,
    initialCurrencies,
  });

  // Transcription logic
  const {
    isFromVoice,
    transcriptionData,
    lowConfidence,
    processTranscription,
    handleTranscriptionError,
    resetVoiceState,
  } = useExpenseModalLogic(currentUserId);

  // Handle expense creation/update
  const handleExpenseAction = useMemo(
    () => (expense: ExpenseDTO) => {
      const successMessage =
        mode === "create" ? "Wydatek został utworzony pomyślnie!" : "Wydatek został zaktualizowany pomyślnie!";

      toast.success(successMessage);

      if (mode === "create") {
        onExpenseCreated?.(expense);
      } else {
        onExpenseUpdated?.(expense);
      }

      onClose();
    },
    [mode, onExpenseCreated, onExpenseUpdated, onClose]
  );

  // Handle transcription completion
  const handleTranscriptionComplete = (result: TranscriptionResultDTO) => {
    processTranscription(result, groupCurrencies);
  };

  // Reset voice state when modal closes
  const handleClose = () => {
    resetVoiceState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl p-0 rounded-lg" showCloseButton={false}>
        <ExpenseModalHeader onClose={handleClose} />
        <ExpenseModalContent
          groupId={groupId}
          groupMembers={groupMembers}
          groupCurrencies={groupCurrencies}
          currentUserId={currentUserId}
          isLoading={isLoading || isGroupDataLoading}
          error={error || groupDataError}
          transcriptionData={transcriptionData}
          isFromVoice={isFromVoice}
          hasLowConfidence={lowConfidence}
          onExpenseCreated={handleExpenseAction}
          onTranscriptionComplete={handleTranscriptionComplete}
          onTranscriptionError={handleTranscriptionError}
          onClose={onClose}
          mode={mode}
          expenseId={expenseId}
          initialExpenseData={initialExpenseData}
        />
      </DialogContent>
    </Dialog>
  );
}
