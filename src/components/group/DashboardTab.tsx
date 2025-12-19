import React, { useCallback, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useInfiniteExpenses } from "@/lib/hooks/useGroupExpenses";
import { useGroupBalances } from "@/lib/hooks/useGroupBalances";
import { useGroupSettlements } from "@/lib/hooks/useGroupSettlements";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useDeleteExpense } from "@/lib/hooks/useDeleteExpense";
import { ExpenseList, ExpenseListSkeleton } from "./ExpenseList";
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

// Create a singleton QueryClient for this component
let dashboardQueryClient: QueryClient | undefined;

const getDashboardQueryClient = () => {
  if (typeof window === "undefined") {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,
          gcTime: 5 * 60 * 1000,
          retry: (failureCount, error: unknown) => {
            const err = error as { status?: number };
            if (err?.status >= 400 && err?.status < 500 && err?.status !== 408 && err?.status !== 429) {
              return false;
            }
            return failureCount < 3;
          },
          refetchOnWindowFocus: true,
          refetchOnReconnect: "always",
        },
        mutations: {
          retry: false,
        },
      },
    });
  }

  if (!dashboardQueryClient) {
    dashboardQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,
          gcTime: 5 * 60 * 1000,
          retry: (failureCount, error: unknown) => {
            const err = error as { status?: number };
            if (err?.status >= 400 && err?.status < 500 && err?.status !== 408 && err?.status !== 429) {
              return false;
            }
            return failureCount < 3;
          },
          refetchOnWindowFocus: true,
          refetchOnReconnect: "always",
        },
        mutations: {
          retry: false,
        },
      },
    });
  }

  return dashboardQueryClient;
};

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

  const memberBalances = useMemo(() => balances?.member_balances || [], [balances]);
  const suggestedSettlements = balances?.suggested_settlements || [];
  const baseCurrencyCode = balances?.base_currency_code || "PLN";

  const isInitialLoading = expensesLoading || balancesLoading;
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
      if (!expense.splits || !expense.amount) return;

      const totalInBaseCurrency = expense.amount_in_base_currency ?? expense.amount ?? 0;

      expense.splits.forEach((split) => {
        if (split.amount <= 0) return;

        // Calculate split amount in base currency proportionally
        const baseCurrencyAmount = (split.amount / expense.amount) * totalInBaseCurrency;
        const currentAmount = spendingMap.get(split.profile_id) ?? 0;
        spendingMap.set(split.profile_id, currentAmount + baseCurrencyAmount);
      });
    });

    return spendingMap;
  }, [expenses]);

  // Calculate max absolute balance for progress bar scaling
  const maxAbsoluteBalance = useMemo(() => {
    if (memberBalances.length === 0) return 0;
    return Math.max(...memberBalances.map((m) => Math.abs(m.balance)));
  }, [memberBalances]);

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

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex h-full items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-muted" />
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-24 rounded-full bg-muted" />
                  <div className="h-4 w-32 rounded-full bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-card rounded-2xl p-6 border shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted" />
                <div className="h-4 w-32 rounded-full bg-muted animate-pulse" />
              </div>
              <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
            </div>
            <ExpenseListSkeleton />
          </div>

          <div className="bg-card rounded-2xl p-6 border shadow-sm">
            <div className="mb-4 h-6 w-40 rounded-full bg-muted animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-14 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="bg-card rounded-2xl p-4 sm:p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Suma wydatków</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
                {totalExpenses.toFixed(2)} {baseCurrencyCode}
              </p>
            </div>
          </div>
        </div>

        {/* Number of Members */}
        <div className="bg-card rounded-2xl p-4 sm:p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl flex-shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Uczestnicy</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{totalMembers}</p>
            </div>
          </div>
        </div>

        {/* Outstanding Balances */}
        <div className="bg-card rounded-2xl p-4 sm:p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Do rozliczenia</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{outstandingBalances}</p>
            </div>
          </div>
        </div>

        {/* Your Balance */}
        <div className="bg-card rounded-2xl p-4 sm:p-6 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Twoje saldo</p>
              <p
                className={`text-xl sm:text-2xl font-bold truncate ${
                  currentUserBalance?.balance && currentUserBalance.balance > 0
                    ? "text-emerald-600"
                    : currentUserBalance?.balance && currentUserBalance.balance < 0
                      ? "text-rose-600"
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
                // Reserved for future: expense details view
              }}
              onExpenseUpdated={handleExpenseUpdated}
              onLoadMore={fetchNextPage}
              hasMore={hasMore}
              isLoadingInitial={expensesLoading}
              isLoadingMore={isFetchingNextPage}
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
            <div className="space-y-3">
              {/* Current user balance first */}
              {currentUserBalance && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {currentUserBalance.full_name?.charAt(0).toUpperCase() || "T"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground truncate">
                            {currentUserBalance.full_name || "Ty"}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary flex-shrink-0">
                            Ty
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground break-words">
                          Łącznie wydał(a): {(memberSpending.get(currentUserBalance.profile_id) || 0).toFixed(2)}{" "}
                          {baseCurrencyCode}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`font-semibold text-sm sm:text-base whitespace-nowrap flex-shrink-0 ${
                        currentUserBalance.balance > 0
                          ? "text-emerald-600"
                          : currentUserBalance.balance < 0
                            ? "text-rose-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      {currentUserBalance.balance >= 0 ? "+" : ""}
                      {currentUserBalance.balance.toFixed(2)} {baseCurrencyCode}
                    </span>
                  </div>
                  {/* Progress bar */}
                  {Math.abs(currentUserBalance.balance) > 0.01 && maxAbsoluteBalance > 0 && (
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute h-full transition-all duration-300 ${
                          currentUserBalance.balance > 0 ? "bg-emerald-500 left-1/2" : "bg-rose-500 right-1/2"
                        }`}
                        style={{
                          width: `${(Math.abs(currentUserBalance.balance) / maxAbsoluteBalance) * 50}%`,
                        }}
                        aria-label={`Saldo: ${currentUserBalance.balance.toFixed(2)} ${baseCurrencyCode}`}
                      />
                      {/* Center line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
                    </div>
                  )}
                </div>
              )}

              {/* All other members */}
              {memberBalances
                .filter((member) => member.profile_id !== userId)
                .map((member) => (
                  <div key={member.profile_id} className="p-4 rounded-xl bg-muted/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium">
                            {member.full_name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-foreground block truncate">
                            {member.full_name || "Użytkownik"}
                          </span>
                          <div className="text-xs text-muted-foreground break-words">
                            Łącznie wydał(a): {(memberSpending.get(member.profile_id) || 0).toFixed(2)}{" "}
                            {baseCurrencyCode}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`font-semibold text-sm sm:text-base whitespace-nowrap flex-shrink-0 ${
                          member.balance > 0
                            ? "text-emerald-600"
                            : member.balance < 0
                              ? "text-rose-600"
                              : "text-muted-foreground"
                        }`}
                      >
                        {member.balance >= 0 ? "+" : ""}
                        {member.balance.toFixed(2)} {baseCurrencyCode}
                      </span>
                    </div>
                    {/* Progress bar */}
                    {Math.abs(member.balance) > 0.01 && maxAbsoluteBalance > 0 && (
                      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`absolute h-full transition-all duration-300 ${
                            member.balance > 0 ? "bg-emerald-500 left-1/2" : "bg-rose-500 right-1/2"
                          }`}
                          style={{
                            width: `${(Math.abs(member.balance) / maxAbsoluteBalance) * 50}%`,
                          }}
                          aria-label={`Saldo: ${member.balance.toFixed(2)} ${baseCurrencyCode}`}
                        />
                        {/* Center line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
                      </div>
                    )}
                  </div>
                ))}

              {/* Suggested Settlements */}
              {suggestedSettlements.length > 0 && (
                <>
                  <div className="border-t border-border my-4"></div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <HandCoins className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Sugerowane rozliczenia</h3>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {suggestedSettlements.map((settlement, index) => (
                        <div
                          key={index}
                          className="group relative p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-sm"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              {/* From user */}
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink">
                                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-rose-100 flex items-center justify-center ring-2 ring-rose-200 flex-shrink-0">
                                  <span className="text-xs font-semibold text-rose-700">
                                    {settlement.from.full_name?.charAt(0).toUpperCase() || "U"}
                                  </span>
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                                  {settlement.from.full_name || "Użytkownik"}
                                </span>
                              </div>

                              {/* Arrow icon */}
                              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />

                              {/* To user */}
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink">
                                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-100 flex items-center justify-center ring-2 ring-emerald-200 flex-shrink-0">
                                  <span className="text-xs font-semibold text-emerald-700">
                                    {settlement.to.full_name?.charAt(0).toUpperCase() || "U"}
                                  </span>
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                                  {settlement.to.full_name || "Użytkownik"}
                                </span>
                              </div>
                            </div>

                            {/* Amount and action */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:flex-shrink-0">
                              <div className="text-left sm:text-right">
                                <div className="text-sm sm:text-base font-bold text-foreground whitespace-nowrap">
                                  {settlement.amount.toFixed(2)} {baseCurrencyCode}
                                </div>
                              </div>

                              {(settlement.from.profile_id === userId || settlement.to.profile_id === userId) && (
                                <button
                                  onClick={() => handleOpenSettlement(settlement)}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg text-xs sm:text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 h-8 sm:h-9 px-3 sm:px-4 shadow-sm whitespace-nowrap"
                                  aria-label={`Rozlicz ${settlement.from.full_name || "Użytkownik"} do ${settlement.to.full_name || "Użytkownik"}`}
                                >
                                  <HandCoins className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  <span>Rozlicz</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* History of Settlements - Timeline Style */}
              {historySettlements.length > 0 && (
                <>
                  <div className="border-t border-border my-4"></div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground">Historia rozliczeń</h3>
                    </div>
                    <div className="relative max-h-64 overflow-y-auto pr-1">
                      {/* Timeline line */}
                      <div className="absolute left-[17px] top-0 bottom-0 w-px bg-gray-200" aria-hidden="true" />

                      <div className="space-y-3">
                        {(showAllSettlements ? historySettlements : historySettlements.slice(0, 5)).map(
                          (settlement, _index) => (
                            <div key={settlement.id} className="relative group">
                              {/* Timeline dot */}
                              <div
                                className="absolute left-2 top-3 h-3 w-3 rounded-full bg-primary shadow-sm ring-4 ring-primary/10 transition-all duration-200 group-hover:ring-6 group-hover:ring-primary/20"
                                aria-hidden="true"
                              />

                              {/* Settlement card */}
                              <div className="ml-10 flex items-center justify-between p-3 rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="font-medium">{settlement.payer.full_name}</span>
                                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                      <span className="font-medium">{settlement.payee.full_name}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(settlement.settled_at).toLocaleDateString("pl-PL")}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-sm font-semibold text-foreground">
                                  {settlement.amount.toFixed(2)} {baseCurrencyCode}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {historySettlements.length > 5 && (
                      <div className="text-center pt-2">
                        <button
                          onClick={() => setShowAllSettlements(!showAllSettlements)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
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

// Main component that wraps content in QueryClientProvider
export const DashboardTab: React.FC<DashboardTabProps> = (props) => {
  const queryClient = getDashboardQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardTabContent {...props} />
    </QueryClientProvider>
  );
};
