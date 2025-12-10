import React, { useCallback, useState } from "react";
import { useInfiniteExpenses } from "@/lib/hooks/useGroupExpenses";
import { useGroupBalances } from "@/lib/hooks/useGroupBalances";
import { useGroupSettlements } from "@/lib/hooks/useGroupSettlements";
import { QueryProvider } from "@/components/QueryProvider";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useDeleteExpense } from "@/lib/hooks/useDeleteExpense";
import { ExpenseList } from "./ExpenseList";
import {
  Plus,
  TrendingUp,
  Users,
  CreditCard,
  ArrowRight,
  HandCoins,
  Scale,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ExpenseListItemDTO, GroupRole, ExpenseDTO, SettlementDTO, SuggestedSettlementDTO } from "@/types";
import { GroupSettingsCards } from "./GroupSettingsCards";
import { useExpenseModal } from "@/components/dashboard/hooks/useExpenseModal";
import { AddExpenseModal } from "./expenses/AddExpenseModal";
import { EditExpenseModal } from "./expenses/EditExpenseModal";
import { SettleBalanceDialog } from "./settlements/SettleBalanceDialog";

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
    refetch: refetchExpenses,
  } = useInfiniteExpenses(
    groupId,
    { enabled: !!groupId } // Fetch all expenses with infinite scrolling
  );

  const {
    balances,
    isLoading: balancesLoading,
    isError: balancesError,
    error: balancesErrorObj,
    refetch: refetchBalances,
  } = useGroupBalances(groupId);

  const { settlements: historySettlements, refetch: refetchSettlements } = useGroupSettlements(groupId, { limit: 50 });

  const memberBalances = balances?.member_balances || [];
  const suggestedSettlements = balances?.suggested_settlements || [];
  const baseCurrencyCode = balances?.base_currency_code || "PLN";

  const isLoading = expensesLoading || balancesLoading;
  const hasError = expensesError || balancesError;

  // Calculate summary metrics
  const totalExpenses = Number(
    expenses.reduce((sum, expense) => sum + (expense.amount_in_base_currency ?? expense.amount ?? 0), 0)
  );
  const currentUserBalance = memberBalances.find((member) => member.profile_id === userId);
  const totalMembers = memberBalances.length;
  const outstandingBalances = memberBalances.filter((member) => Math.abs(member.balance) > 0.01).length;

  // Calculate member spending from expense splits
  const memberSpending = useMemo(() => {
    const spendingMap = new Map<string, number>();

    expenses.forEach((expense) => {
      if (!expense.splits || expense.amount === 0) return;

      expense.splits.forEach((split) => {
        if (split.amount <= 0) return;

        // Calculate split amount in base currency proportionally
        const baseCurrencyAmount = (split.amount / expense.amount) * expense.amount_in_base_currency;
        const currentAmount = spendingMap.get(split.profile_id) || 0;
        spendingMap.set(split.profile_id, currentAmount + baseCurrencyAmount);
      });
    });

    return spendingMap;
  }, [expenses]);

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

  // Settlement dialog state
  const [settlementDialog, setSettlementDialog] = useState<{
    isOpen: boolean;
    prefillData: {
      payerId: string;
      payeeId: string;
      amount: number;
    } | null;
  }>({
    isOpen: false,
    prefillData: null,
  });

  // Expand settlements history
  const [showAllSettlements, setShowAllSettlements] = useState(false);

  // Delete expense mutation
  const deleteExpenseMutation = useDeleteExpense();

  // Expense modal hook with success callback that refetches expenses and balances
  const expenseModal = useExpenseModal(async () => {
    await Promise.all([refetchExpenses(), refetchBalances()]);
  });

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
    }
  }, [deleteDialogState.expense, deleteExpenseMutation, groupId]);

  // Handle cancel delete
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogState({ isOpen: false, expense: null });
  }, []);

  // Handle edit modal close
  const handleCloseEdit = useCallback(() => {
    setEditModalState({ isOpen: false, expense: null });
  }, []);

  // Handle successful expense update
  const handleExpenseUpdated = useCallback(
    async (_updatedExpense: ExpenseDTO) => {
      await Promise.all([refetchExpenses(), refetchBalances()]);
      setEditModalState({ isOpen: false, expense: null });
    },
    [refetchExpenses, refetchBalances]
  );

  // Handle add expense
  const handleAddExpense = useCallback(async () => {
    await expenseModal.openModal(groupId);
  }, [expenseModal, groupId]);

  // Handle open settlement dialog
  const handleOpenSettlement = useCallback((suggested?: SuggestedSettlementDTO) => {
    setSettlementDialog({
      isOpen: true,
      prefillData: suggested
        ? {
            payerId: suggested.from.profile_id,
            payeeId: suggested.to.profile_id,
            amount: suggested.amount,
          }
        : null,
    });
  }, []);

  // Handle settlement created
  const handleSettlementCreated = useCallback(
    async (_settlement: SettlementDTO) => {
      await Promise.all([refetchBalances(), refetchSettlements()]);
    },
    [refetchBalances, refetchSettlements]
  );

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
              <p className="text-sm font-medium text-muted-foreground">Uczestnicy</p>
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
              onClick={handleAddExpense}
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
                onClick={handleAddExpense}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
              >
                Dodaj pierwszy wydatek
              </button>
            </div>
          ) : (
            <ExpenseList
              expenses={expenses}
              currentUserId={userId}
              baseCurrencyCode={baseCurrencyCode}
              groupId={groupId}
              groupMembers={expenseModal.groupMembers}
              groupCurrencies={expenseModal.groupCurrencies}
              onExpenseClick={(_expense) => {
                /* TODO: Open expense details modal */
              }}
              onExpenseUpdated={handleExpenseUpdated}
              onLoadMore={fetchNextPage}
              hasMore={hasMore}
              isLoading={isFetchingNextPage}
            />
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
                      <div className="text-xs text-muted-foreground">
                        Łącznie wydał(a): {(memberSpending.get(currentUserBalance.profile_id) || 0).toFixed(2)}{" "}
                        {baseCurrencyCode}
                      </div>
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
                      <div>
                        <span className="font-medium text-foreground">{member.full_name || "Użytkownik"}</span>
                        <div className="text-xs text-muted-foreground">
                          Łącznie wydał(a): {(memberSpending.get(member.profile_id) || 0).toFixed(2)} {baseCurrencyCode}
                        </div>
                      </div>
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
                      {suggestedSettlements.map((settlement, index) => (
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

                            {(settlement.from.profile_id === userId || settlement.to.profile_id === userId) && (
                              <button
                                onClick={() => handleOpenSettlement(settlement)}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary hover:text-primary/80 hover:bg-primary/10 h-7 w-7"
                                aria-label={`Rozlicz ${settlement.from.full_name || "Użytkownik"} do ${settlement.to.full_name || "Użytkownik"}`}
                              >
                                <HandCoins className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* History of Settlements */}
              {historySettlements.length > 0 && (
                <>
                  <div className="border-t border-border my-4"></div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-foreground">Historia rozliczeń</h3>
                    </div>
                    <div className="space-y-2">
                      {(showAllSettlements ? historySettlements : historySettlements.slice(0, 5)).map((settlement) => (
                        <div
                          key={settlement.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{settlement.payer.full_name}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{settlement.payee.full_name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(settlement.settled_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            {settlement.amount.toFixed(2)} {baseCurrencyCode}
                          </div>
                        </div>
                      ))}

                      {historySettlements.length > 5 && (
                        <div className="text-center pt-2">
                          <button
                            onClick={() => setShowAllSettlements(!showAllSettlements)}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium"
                          >
                            {showAllSettlements ? (
                              <>
                                Zwiń <ChevronUp className="h-3 w-3" />
                              </>
                            ) : (
                              <>
                                Zobacz wszystkie ({historySettlements.length}) <ChevronDown className="h-3 w-3" />
                              </>
                            )}
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
      <GroupSettingsCards groupId={groupId} userRole={userRole} />

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
          groupMembers={expenseModal.groupMembers}
          groupCurrencies={expenseModal.groupCurrencies}
          currentUserId={userId}
          expense={editModalState.expense}
          isOpen={editModalState.isOpen}
          onClose={handleCloseEdit}
          onExpenseUpdated={handleExpenseUpdated}
        />
      )}

      {/* Add Expense Modal */}
      {expenseModal.selectedExpenseGroupId && (
        <AddExpenseModal
          groupId={expenseModal.selectedExpenseGroupId}
          groupMembers={expenseModal.groupMembers}
          groupCurrencies={expenseModal.groupCurrencies}
          currentUserId={userId}
          isOpen={!!expenseModal.selectedExpenseGroupId}
          onClose={expenseModal.closeModal}
          onExpenseCreated={expenseModal.handleExpenseSuccess}
          isLoading={expenseModal.isLoading}
        />
      )}

      {/* Settle Balance Dialog */}
      <SettleBalanceDialog
        isOpen={settlementDialog.isOpen}
        onClose={() => setSettlementDialog({ isOpen: false, prefillData: null })}
        groupId={groupId}
        baseCurrencyCode={baseCurrencyCode}
        prefillData={settlementDialog.prefillData}
        groupMembers={memberBalances.map((m) => ({
          profile_id: m.profile_id,
          full_name: m.full_name,
          avatar_url: m.avatar_url,
          status: m.status,
        }))}
        onSettlementCreated={handleSettlementCreated}
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
