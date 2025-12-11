import React, { useRef, useCallback, useMemo, useState } from "react";
import { ExpenseListItem } from "./ExpenseListItem";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EditExpenseModal } from "./expenses/EditExpenseModal";
import { useDeleteExpense } from "@/lib/hooks/useDeleteExpense";
import type { ExpenseListItemDTO, GroupMemberSummaryDTO, GroupCurrencyDTO, ExpenseDTO } from "@/types";

export interface ExpenseListProps {
  expenses: ExpenseListItemDTO[];
  currentUserId: string;
  baseCurrencyCode: string;
  groupId: string;
  groupMembers: GroupMemberSummaryDTO[];
  groupCurrencies: GroupCurrencyDTO[];
  onExpenseClick: (expense: ExpenseListItemDTO) => void;
  onExpenseUpdated?: (expense: ExpenseDTO) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  currentUserId,
  baseCurrencyCode,
  groupId,
  groupMembers,
  groupCurrencies,
  onExpenseClick,
  onExpenseUpdated,
  onLoadMore,
  hasMore,
  isLoadingInitial,
  isLoadingMore,
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

  // Edit modal state
  const [editModalState, setEditModalState] = useState<{
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
      if (isLoadingMore) return;

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
    [isLoadingMore, hasMore, onLoadMore]
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
    } catch (_error) {
      // Error is handled by the mutation
      return;
    }
  }, [deleteDialogState.expense, deleteExpenseMutation, groupId]);

  // Handle cancel delete
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogState({ isOpen: false, expense: null });
  }, []);

  // Handle edit action
  const handleEdit = useCallback((expense: ExpenseListItemDTO) => {
    setEditModalState({
      isOpen: true,
      expense,
    });
  }, []);

  // Handle edit modal close
  const handleCloseEdit = useCallback(() => {
    setEditModalState({ isOpen: false, expense: null });
  }, []);

  // Handle successful expense update
  const handleExpenseUpdated = useCallback(
    (updatedExpense: ExpenseDTO) => {
      onExpenseUpdated?.(updatedExpense);
      setEditModalState({ isOpen: false, expense: null });
    },
    [onExpenseUpdated]
  );

  const groupedExpenses = useMemo(() => {
    const groups = new Map<
      string,
      {
        label: string;
        items: ExpenseListItemDTO[];
      }
    >();

    expenses.forEach((expense) => {
      const date = new Date(expense.expense_date);
      const key = date.toISOString().slice(0, 10);

      if (!groups.has(key)) {
        const label = date.toLocaleDateString("pl-PL", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        groups.set(key, {
          label,
          items: [],
        });
      }

      groups.get(key)?.items.push(expense);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => (a > b ? -1 : 1))
      .map(([, value]) => value);
  }, [expenses]);

  const lastExpenseId = expenses.at(-1)?.id;

  if (isLoadingInitial) {
    return <ExpenseListSkeleton />;
  }

  if (expenses.length === 0 && !isLoadingInitial) {
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
    <div className="relative space-y-4" role="list" aria-label="Lista wydatków">
      {/* Main timeline line - consistent throughout the list */}
      <div className="absolute left-[17px] top-0 bottom-0 w-px bg-gray-200" aria-hidden />

      {groupedExpenses.map((group, groupIndex) => (
        <section key={group.label} className="relative">
          {groupIndex > 0 && <div className="border-t border-gray-100 my-6" />}
          <div className="space-y-3">
            <div className="flex items-center gap-3 pl-10">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {group.items.length}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-muted-foreground capitalize tracking-wide">
                  {group.label}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {group.items.map((expense, index) => {
                const isLastInList = expense.id === lastExpenseId;
                const isLastInGroup = index === group.items.length - 1;
                return (
                  <div
                    key={expense.id}
                    ref={isLastInList ? lastExpenseRef : undefined}
                    role="listitem"
                    className="relative"
                  >
                    <ExpenseListItem
                      expense={expense}
                      isOwner={expense.created_by.id === currentUserId}
                      baseCurrencyCode={baseCurrencyCode}
                      onClick={() => onExpenseClick(expense)}
                      onEdit={() => handleEdit(expense)}
                      onDelete={() => handleDelete(expense)}
                      showConnector={!isLastInGroup}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Loading indicator for infinite scroll */}
      {isLoadingMore && hasMore && (
        <div className="space-y-4">
          <ExpenseListSkeleton rows={2} showLine />
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

      {/* Edit Expense Modal */}
      {editModalState.expense && (
        <EditExpenseModal
          groupId={groupId}
          groupMembers={groupMembers}
          groupCurrencies={groupCurrencies}
          currentUserId={currentUserId}
          expense={editModalState.expense}
          isOpen={editModalState.isOpen}
          onClose={handleCloseEdit}
          onExpenseUpdated={handleExpenseUpdated}
        />
      )}
    </div>
  );
};

interface ExpenseListSkeletonProps {
  rows?: number;
  showLine?: boolean;
}

export const ExpenseListSkeleton: React.FC<ExpenseListSkeletonProps> = ({ rows = 4, showLine = false }) => {
  return (
    <div className="relative space-y-3">
      {showLine && <div className="absolute left-[17px] top-0 bottom-0 w-px bg-gray-200" aria-hidden />}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="relative">
          <div className="absolute left-2 top-4 h-3 w-3 rounded-full bg-muted ring-4 ring-muted/20" aria-hidden />
          <div className="ml-10 animate-pulse rounded-xl border border-gray-100 bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-2.5 w-16 rounded-full bg-muted" />
                <div className="h-4 w-40 rounded-full bg-muted" />
                <div className="flex gap-2 items-center">
                  <div className="h-7 w-7 rounded-full bg-muted" />
                  <div className="h-3 w-3 rounded-full bg-muted/40" />
                  <div className="h-7 w-7 rounded-full bg-muted" />
                  <div className="h-7 w-7 rounded-full bg-muted" />
                </div>
                <div className="h-3 w-56 rounded-full bg-muted/60" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="h-6 w-24 rounded-full bg-muted" />
                <div className="h-3 w-16 rounded-full bg-muted/60" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
