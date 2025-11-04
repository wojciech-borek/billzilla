import React from "react";

import { ExpenseModal } from "./ExpenseModal";
import type { GroupMemberSummaryDTO, GroupCurrencyDTO, ExpenseDTO } from "@/types";

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
  return (
    <ExpenseModal
      mode="create"
      groupId={groupId}
      currentUserId={currentUserId}
      isOpen={isOpen}
      onClose={onClose}
      onExpenseCreated={onExpenseCreated}
      isLoading={isLoading}
      error={error}
      initialMembers={groupMembers}
      initialCurrencies={groupCurrencies}
    />
  );
}
