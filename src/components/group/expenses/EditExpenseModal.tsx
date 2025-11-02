import React, { useMemo } from "react";

import { ExpenseModal } from "./ExpenseModal";
import type { GroupMemberSummaryDTO, GroupCurrencyDTO, ExpenseDTO, CreateExpenseCommand } from "@/types";

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
  const initialExpenseData = useMemo<CreateExpenseCommand>(
    () => ({
      description: expense.description,
      amount: expense.amount,
      currency_code: expense.currency_code,
      expense_date: new Date(expense.expense_date).toISOString().slice(0, 16),
      payer_id: expense.payer_id,
      splits: expense.splits.map((split) => ({
        profile_id: split.profile_id,
        amount: split.amount,
      })),
    }),
    [expense.description, expense.amount, expense.currency_code, expense.expense_date, expense.payer_id, expense.splits]
  );

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
