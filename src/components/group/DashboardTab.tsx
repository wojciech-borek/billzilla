import React, { useRef, useCallback, useState } from "react";
import { useInfiniteExpenses } from "@/lib/hooks/useGroupExpenses";
import { useGroupBalances } from "@/lib/hooks/useGroupBalances";
import { QueryProvider } from "@/components/QueryProvider";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useDeleteExpense } from "@/lib/hooks/useDeleteExpense";
import { Plus, TrendingUp, Users, CreditCard, ArrowRight, Edit2, Trash2, HandCoins, Scale } from "lucide-react";
import type { ExpenseListItemDTO, GroupRole } from "@/types";
import { GroupSettingsCards } from "./GroupSettingsCards";

export interface DashboardTabProps {
  groupId: string;
  userId: string;
  userRole: GroupRole;
}

// Component that safely uses React Query hooks only when QueryClient is available
const DashboardTabContent: React.FC<DashboardTabProps> = ({ groupId, userId, userRole }) => {
  const {
    expenses,
    isLoading: expensesLoading,
    error: expensesError,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteExpenses(
    groupId,
    { enabled: !!groupId } // Fetch all expenses with infinite scrolling
  );

  const {
    balances,
    isLoading: balancesLoading,
    isError: balancesError,
    error: balancesErrorObj,
  } = useGroupBalances(groupId);

  const memberBalances = balances?.member_balances || [];
  const suggestedSettlements = balances?.suggested_settlements || [];
  const baseCurrencyCode = balances?.base_currency_code || "PLN";

  const isLoading = expensesLoading || balancesLoading;
  const hasError = expensesError || balancesError;

  // Calculate summary metrics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currentUserBalance = memberBalances.find((member) => member.profile_id === userId);
  const totalMembers = memberBalances.length;
  const outstandingBalances = memberBalances.filter((member) => Math.abs(member.balance) > 0.01).length;

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
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastExpenseRef = useCallback(
    (node: HTMLDivElement) => {
      if (isFetchingNextPage) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            fetchNextPage();
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
    [isFetchingNextPage, hasMore, fetchNextPage]
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

  // Handle edit action (placeholder for now - navigate to edit page when implemented)
  const handleEdit = useCallback((_expense: ExpenseListItemDTO) => {
    // TODO: Navigate to edit expense page when implemented
  }, []);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Ładowanie dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-destructive/10 p-6 mb-4">
            <svg className="h-12 w-12 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Nie udało się załadować danych</h3>
          <p className="text-muted-foreground mb-4">
            {expensesError?.message || balancesErrorObj?.message || "Wystąpił błąd podczas ładowania danych."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Suma wydatków</p>
              <p className="text-2xl font-bold text-foreground">
                {totalExpenses.toFixed(2)} {baseCurrencyCode}
              </p>
            </div>
          </div>
        </div>

        {/* Number of Members */}
        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Członkowie</p>
              <p className="text-2xl font-bold text-foreground">{totalMembers}</p>
            </div>
          </div>
        </div>

        {/* Outstanding Balances */}
        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl">
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Do rozliczenia</p>
              <p className="text-2xl font-bold text-foreground">{outstandingBalances}</p>
            </div>
          </div>
        </div>

        {/* Your Balance */}
        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-xl">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Twoje saldo</p>
              <p
                className={`text-2xl font-bold ${
                  currentUserBalance?.balance && currentUserBalance.balance > 0
                    ? "text-green-600"
                    : currentUserBalance?.balance && currentUserBalance.balance < 0
                      ? "text-red-600"
                      : "text-muted-foreground"
                }`}
              >
                {currentUserBalance?.balance ? currentUserBalance.balance.toFixed(2) : "0.00"} {baseCurrencyCode}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Expenses */}
        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Wydatki</h2>
            </div>
            <button
              onClick={() => (window.location.href = `/groups/${groupId}/expenses/new`)}
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 transition-colors"
              aria-label="Dodaj wydatek"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <div className="rounded-full bg-muted p-3 mb-3 mx-auto w-fit">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-3">Brak wydatków</p>
              <button
                onClick={() => (window.location.href = `/groups/${groupId}/expenses/new`)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
              >
                Dodaj pierwszy wydatek
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {expenses.map((expense, index) => (
                <div
                  key={expense.id}
                  ref={index === expenses.length - 1 ? lastExpenseRef : undefined}
                  className="rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => {
                    /* TODO: Open expense details modal */
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      {
                        /* TODO: Open expense details modal */
                      }
                    }
                  }}
                  aria-label={`Wydatek: ${expense.description}, kwota: ${expense.amount_in_base_currency?.toFixed(2) || expense.amount.toFixed(2)} ${baseCurrencyCode}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side - Content */}
                    <div className="flex-1 min-w-0">
                      {/* Description */}
                      <h4 className="font-medium text-foreground mb-3">{expense.description}</h4>

                      {/* Participants info */}
                      <div className="flex flex-col gap-2">
                        {/* Participants avatars with amounts */}
                        <div className="flex items-center gap-2">
                          {expense.splits.slice(0, 3).map((split, splitIndex) => (
                            <div key={split.profile_id} className="flex flex-col items-center gap-1 relative">
                              <div
                                className={`h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                                  split.profile_id === expense.payer_id
                                    ? "bg-green-100 border-green-300 text-green-700"
                                    : "bg-primary/10 border-background text-primary"
                                }`}
                              >
                                {split.full_name?.charAt(0).toUpperCase() || "U"}
                              </div>
                              <div className="text-xs text-muted-foreground font-medium">
                                {split.amount.toFixed(2)} {expense.currency_code}
                              </div>
                              {splitIndex === 2 && expense.splits.length > 3 && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-muted border border-background flex items-center justify-center">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    +{expense.splits.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Amount and actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Amount */}
                      <div className="text-right">
                        <div className="text-lg font-semibold text-foreground">
                          {expense.amount_in_base_currency?.toFixed(2) ?? expense.amount.toFixed(2)} {baseCurrencyCode}
                        </div>
                        {expense.currency_code !== baseCurrencyCode && (
                          <div className="text-xs text-muted-foreground">
                            {expense.amount.toFixed(2)} {expense.currency_code}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(expense.expense_date).toLocaleDateString("pl-PL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          • {expense.created_by.full_name || "Użytkownik"}
                        </div>
                      </div>

                      {/* Actions - only visible for owner */}
                      {expense.created_by.id === userId && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(expense);
                            }}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8"
                            aria-label="Edytuj wydatek"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(expense);
                            }}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                            aria-label="Usuń wydatek"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator for infinite scroll */}
              {isFetchingNextPage && (
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
            </div>
          )}
        </div>

        {/* Balance Summary */}
        <div className="bg-card rounded-2xl p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Podsumowanie sald</h2>
            </div>
          </div>

          {memberBalances.length === 0 ? (
            <div className="text-center py-8">
              <div className="rounded-full bg-muted p-3 mb-3 mx-auto w-fit">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Brak danych o saldach</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {/* Current user balance first */}
              {currentUserBalance && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {currentUserBalance.full_name?.charAt(0).toUpperCase() || "T"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{currentUserBalance.full_name || "Ty"}</span>
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                        Ty
                      </span>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${
                      currentUserBalance.balance > 0
                        ? "text-green-600"
                        : currentUserBalance.balance < 0
                          ? "text-red-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {currentUserBalance.balance >= 0 ? "+" : ""}
                    {currentUserBalance.balance.toFixed(2)} {baseCurrencyCode}
                  </span>
                </div>
              )}

              {/* All other members */}
              {memberBalances
                .filter((member) => member.profile_id !== userId)
                .map((member) => (
                  <div key={member.profile_id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">{member.full_name?.charAt(0).toUpperCase() || "U"}</span>
                      </div>
                      <span className="font-medium text-foreground">{member.full_name || "Użytkownik"}</span>
                    </div>
                    <span
                      className={`font-semibold ${
                        member.balance > 0
                          ? "text-green-600"
                          : member.balance < 0
                            ? "text-red-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      {member.balance >= 0 ? "+" : ""}
                      {member.balance.toFixed(2)} {baseCurrencyCode}
                    </span>
                  </div>
                ))}

              {/* Suggested Settlements */}
              {suggestedSettlements.length > 0 && (
                <>
                  <div className="border-t border-border my-4"></div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-foreground">Sugerowane rozliczenia</h3>
                    </div>
                    <div className="space-y-2">
                      {suggestedSettlements.slice(0, 3).map((settlement, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {settlement.from.full_name?.charAt(0).toUpperCase() || "U"}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {settlement.from.full_name || "Użytkownik"}
                              </span>
                            </div>

                            <ArrowRight className="h-3 w-3 text-muted-foreground" />

                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {settlement.to.full_name?.charAt(0).toUpperCase() || "U"}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {settlement.to.full_name || "Użytkownik"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-sm font-semibold text-foreground">
                                {settlement.amount.toFixed(2)} {baseCurrencyCode}
                              </div>
                            </div>
                            <button
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground hover:text-foreground hover:bg-accent h-7 w-7"
                              aria-label={`Rozlicz ${settlement.from.full_name || "Użytkownik"} do ${settlement.to.full_name || "Użytkownik"}`}
                            >
                              <HandCoins className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {suggestedSettlements.length > 3 && (
                        <div className="text-center pt-2">
                          <button
                            onClick={() => (window.location.href = `/groups/${groupId}/balances`)}
                            className="text-xs text-primary hover:text-primary/80 font-medium"
                          >
                            Zobacz wszystkie ({suggestedSettlements.length})
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Group Settings */}
      <GroupSettingsCards groupId={groupId} userId={userId} userRole={userRole} />

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

// Main component that safely renders the content only on the client side
export const DashboardTab: React.FC<DashboardTabProps> = (props) => {
  // Simple check if we're on the client side
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading state until we're on the client side
  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Ładowanie dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryProvider>
      <DashboardTabContent {...props} />
    </QueryProvider>
  );
};
