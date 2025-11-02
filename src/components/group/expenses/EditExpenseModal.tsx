import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

import { useExpenseModalLogic } from "@/lib/hooks/useExpenseModalLogic";
import { ExpenseModalHeader } from "./ExpenseModalHeader";
import { ExpenseModalContent } from "./ExpenseModalContent";
import type { GroupMemberSummaryDTO, GroupCurrencyDTO, ExpenseDTO, TranscriptionResultDTO } from "@/types";

interface EditExpenseModalProps {
  groupId: string;
  groupMembers: GroupMemberSummaryDTO[];
  groupCurrencies: GroupCurrencyDTO[];
  currentUserId: string;
  expense: ExpenseDTO;
  isOpen: boolean;
  onClose: () => void;
  onExpenseUpdated?: (expense: ExpenseDTO) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function EditExpenseModal({
  groupId,
  groupMembers,
  groupCurrencies,
  currentUserId,
  expense,
  isOpen,
  onClose,
  onExpenseUpdated,
  isLoading = false,
  error = null,
}: EditExpenseModalProps) {
  const [groupData, setGroupData] = useState<{
    members: GroupMemberSummaryDTO[];
    currencies: GroupCurrencyDTO[];
  }>({
    members: groupMembers || [],
    currencies: groupCurrencies || [],
  });
  const [isGroupDataLoading, setIsGroupDataLoading] = useState(false);

  // Load group data when modal opens
  useEffect(() => {
    if (isOpen && groupId) {
      const loadGroupData = async () => {
        // If we already have data from props, use it
        if (groupMembers.length > 0 && groupCurrencies.length > 0) {
          setGroupData({
            members: groupMembers,
            currencies: groupCurrencies,
          });
          return;
        }

        // Otherwise load from API
        setIsGroupDataLoading(true);
        try {
          const response = await fetch(`/api/groups/${groupId}`);
          if (!response.ok) {
            throw new Error("Nie udało się załadować danych grupy");
          }

          const groupDataFromApi = await response.json();

          setGroupData({
            members: (groupDataFromApi.members || []).map(
              (member: {
                profile_id: string;
                full_name: string;
                avatar_url: string | null;
                status: string;
                role: string;
              }) => ({
                profile_id: member.profile_id,
                full_name: member.full_name,
                avatar_url: member.avatar_url,
                status: member.status,
                role: member.role,
              })
            ),
            currencies: groupDataFromApi.group_currencies || [],
          });
        } catch {
          toast.error("Nie udało się załadować danych grupy");
        } finally {
          setIsGroupDataLoading(false);
        }
      };

      loadGroupData();
    }
  }, [isOpen, groupId, groupMembers, groupCurrencies]);

  const {
    isFromVoice,
    transcriptionData,
    lowConfidence,
    processTranscription,
    handleTranscriptionError,
    resetVoiceState,
  } = useExpenseModalLogic(currentUserId);

  const handleExpenseUpdated = async (updatedExpense: ExpenseDTO) => {
    toast.success("Wydatek został zaktualizowany pomyślnie!");
    onExpenseUpdated?.(updatedExpense);
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

  // Convert expense to initial data format for the form
  const initialData = {
    description: expense.description,
    amount: expense.amount,
    currency_code: expense.currency_code,
    expense_date: new Date(expense.expense_date).toISOString().slice(0, 16),
    payer_id: expense.payer_id,
    splits: expense.splits.map((split) => ({
      profile_id: split.profile_id,
      amount: split.amount,
    })),
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl p-0 rounded-lg" showCloseButton={false}>
        <ExpenseModalHeader onClose={handleClose} />
        <ExpenseModalContent
          groupId={groupId}
          groupMembers={groupData.members}
          groupCurrencies={groupData.currencies}
          currentUserId={currentUserId}
          isLoading={isLoading || isGroupDataLoading}
          error={error}
          transcriptionData={transcriptionData}
          isFromVoice={isFromVoice}
          hasLowConfidence={lowConfidence}
          onExpenseCreated={handleExpenseUpdated}
          onTranscriptionComplete={handleTranscriptionComplete}
          onTranscriptionError={handleTranscriptionError}
          onClose={onClose}
          mode="edit"
          expenseId={expense.id}
          initialExpenseData={initialData}
        />
      </DialogContent>
    </Dialog>
  );
}
