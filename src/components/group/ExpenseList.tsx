import React, { useRef, useCallback, useState } from "react";
import { ExpenseListItem } from "./ExpenseListItem";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useDeleteExpense } from "@/lib/hooks/useDeleteExpense";
import type { ExpenseListItemDTO } from "@/types";

export interface ExpenseListProps {
  expenses: ExpenseListItemDTO[];
  currentUserId: string;
  baseCurrencyCode: string;
  groupId: string;
  onExpenseClick: (expense: ExpenseListItemDTO) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  currentUserId,
  baseCurrencyCode,
  groupId,
  onExpenseClick,
  onLoadMore,
  hasMore,
  isLoading,
}) => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    expense: ExpenseListItemDTO | null;
  }>({
    isOpen: false,
    expense: null,
  });

  // Delete expense mutation
  const deleteExpenseMutation = useDeleteExpense();

  // Intersection Observer for infinite scroll
  const lastExpenseRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            onLoadMore();
          }
        },
        {
          threshold: 0.1,
          rootMargin: "100px",
        }
      );

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isLoading, hasMore, onLoadMore]
  );

  // Handle delete action
  const handleDelete = useCallback((expense: ExpenseListItemDTO) => {
    setDeleteDialogState({
      isOpen: true,
      expense,
    });
  }, []);

  // Handle confirmed delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDialogState.expense) return;

    try {
      await deleteExpenseMutation.mutateAsync({
        expenseId: deleteDialogState.expense.id,
        groupId,
      });

      setDeleteDialogState({ isOpen: false, expense: null });
    } catch (error) {
      // Error is handled by the mutation
      console.error("Failed to delete expense:", error);
    }
  }, [deleteDialogState.expense, deleteExpenseMutation, groupId]);

  // Handle cancel delete
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogState({ isOpen: false, expense: null });
  }, []);

  if (expenses.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Brak wydatków w tej grupie</h3>
        <p className="text-muted-foreground">Dodaj pierwszy wydatek, aby rozpocząć śledzenie kosztów.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="list" aria-label="Lista wydatków">
      {expenses.map((expense, index) => (
        <div key={expense.id} ref={index === expenses.length - 1 ? lastExpenseRef : undefined} role="listitem">
          <ExpenseListItem
            expense={expense}
            isOwner={expense.created_by.id === currentUserId}
            baseCurrencyCode={baseCurrencyCode}
            onClick={() => onExpenseClick(expense)}
            onDelete={() => handleDelete(expense)}
          />
        </div>
      ))}

      {/* Loading indicator for infinite scroll */}
      {isLoading && hasMore && (
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
            <span>Ładowanie kolejnych wydatków...</span>
          </div>
        </div>
      )}

      {/* End of list message */}
      {!hasMore && expenses.length > 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">To wszystkie wydatki w tej grupie</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogState.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Usuń wydatek"
        description={`Czy na pewno chcesz usunąć wydatek "${deleteDialogState.expense?.description}"? Tej akcji nie można cofnąć.`}
        confirmText="Usuń"
        cancelText="Anuluj"
        variant="destructive"
        isLoading={deleteExpenseMutation.isPending}
      />
    </div>
  );
};
