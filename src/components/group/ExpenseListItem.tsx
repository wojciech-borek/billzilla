import React from "react";
import type { ExpenseListItemDTO } from "@/types";

export interface ExpenseListItemProps {
  expense: ExpenseListItemDTO;
  isOwner: boolean;
  baseCurrencyCode: string;
  onClick: () => void;
  onDelete?: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export const ExpenseListItem: React.FC<ExpenseListItemProps> = ({
  expense,
  isOwner,
  baseCurrencyCode,
  onClick,
  onDelete,
  isExpanded: _isExpanded = false,
  onToggleExpanded: _onToggleExpanded,
}) => {
  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      className="rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Wydatek: ${expense.description}, kwota: ${formatCurrency(expense.amount_in_base_currency, baseCurrencyCode)}`}
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
              {expense.splits.slice(0, 3).map((split, index) => (
                <div key={split.profile_id} className="flex flex-col items-center gap-1">
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
                    {formatCurrency(split.amount, expense.currency_code)}
                  </div>
                  {index === 2 && expense.splits.length > 3 && (
                    <div className="absolute top-0 right-0 h-4 w-4 rounded-full bg-muted border border-background flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">+{expense.splits.length - 3}</span>
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
              {formatCurrency(expense.amount_in_base_currency, baseCurrencyCode)}
            </div>
            {expense.currency_code !== baseCurrencyCode && (
              <div className="text-xs text-muted-foreground">
                {formatCurrency(expense.amount, expense.currency_code)}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              {formatDate(expense.expense_date)} • {expense.created_by.full_name || "Użytkownik"}
            </div>
          </div>

          {/* Actions - only visible for owner */}
          {isOwner && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                aria-label="Usuń wydatek"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
