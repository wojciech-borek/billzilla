import React, { useMemo } from "react";

import { ExpenseModal } from "./ExpenseModal";
import { transformExpenseToFormData } from "./utils/expenseTransformers";
import type { GroupMemberSummaryDTO, GroupCurrencyDTO, ExpenseDTO } from "@/types";

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
  // Memoize expense data transformation for performance
  const initialExpenseData = useMemo(() => transformExpenseToFormData(expense), [expense]);

  return (
    <ExpenseModal
      mode="edit"
      groupId={groupId}
      currentUserId={currentUserId}
      isOpen={isOpen}
      onClose={onClose}
      onExpenseUpdated={onExpenseUpdated}
      isLoading={isLoading}
      error={error}
      expenseId={expense.id}
      initialExpenseData={initialExpenseData}
      initialMembers={groupMembers}
      initialCurrencies={groupCurrencies}
    />
  );
}
