import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

import { useExpenseModalLogic } from "@/lib/hooks/useExpenseModalLogic";
import { ExpenseModalHeader } from "./ExpenseModalHeader";
import { ExpenseModalContent } from "./ExpenseModalContent";
import type { GroupMemberSummaryDTO, GroupCurrencyDTO, ExpenseDTO, TranscriptionResultDTO } from "@/types";

interface AddExpenseModalProps {
  groupId: string;
  groupMembers: GroupMemberSummaryDTO[];
  groupCurrencies: GroupCurrencyDTO[];
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onExpenseCreated?: (expense: ExpenseDTO) => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Modal wrapper for expense creation form
 */
export function AddExpenseModal({
  groupId,
  groupMembers,
  groupCurrencies,
  currentUserId,
  isOpen,
  onClose,
  onExpenseCreated,
  isLoading = false,
  error = null,
}: AddExpenseModalProps) {
  const {
    isFromVoice,
    transcriptionData,
    lowConfidence,
    processTranscription,
    handleTranscriptionError,
    resetVoiceState,
  } = useExpenseModalLogic(currentUserId);

  const handleExpenseCreated = async (expense: ExpenseDTO) => {
    toast.success("Wydatek został utworzony pomyślnie!");
    onExpenseCreated?.(expense);
    onClose();
  };

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
          isLoading={isLoading}
          error={error}
          transcriptionData={transcriptionData}
          isFromVoice={isFromVoice}
          hasLowConfidence={lowConfidence}
          onExpenseCreated={handleExpenseCreated}
          onTranscriptionComplete={handleTranscriptionComplete}
          onTranscriptionError={handleTranscriptionError}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
