import React from "react";
import type { ExpenseListItemDTO } from "@/types";
import { cn, formatCurrency, getInitials } from "@/lib/utils";

export interface ExpenseListItemProps {
  expense: ExpenseListItemDTO;
  isOwner: boolean;
  baseCurrencyCode: string;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showConnector?: boolean;
}

export const ExpenseListItem: React.FC<ExpenseListItemProps> = ({
  expense,
  isOwner,
  baseCurrencyCode,
  onClick,
  onEdit,
  onDelete,
  showConnector = false,
}) => {
  const handleCardClick = () => {
    onClick();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardClick();
    }
  };

  const expenseDate = new Date(expense.expense_date);
  const formattedTime = expenseDate.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative group">
      {/* Timeline dot - anchored to timeline */}
      <div
        className="absolute left-2 top-4 h-3 w-3 rounded-full bg-primary shadow-sm ring-4 ring-primary/10 transition-all duration-200 group-hover:ring-6 group-hover:ring-primary/20"
        aria-hidden
      />

      {/* Timeline connector line */}
      {showConnector && <div className="absolute left-[17px] top-7 bottom-0 w-px bg-gray-200" aria-hidden />}

      {/* Expense card with increased padding */}
      <div
        className="ml-10 rounded-xl border border-gray-100 bg-card p-5 shadow-sm shadow-gray-100/50 transition-all duration-300 ease-out hover:shadow-md hover:shadow-gray-200/60 focus-within:ring-2 focus-within:ring-primary/20"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`Wydatek: ${expense.description}, kwota: ${formatCurrency(expense.amount_in_base_currency, baseCurrencyCode)}`}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left side: Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Time and Title */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 leading-none">
                {formattedTime}
              </span>
              <h4 className="text-base font-semibold text-foreground leading-tight">{expense.description}</h4>
            </div>

            {/* Participants with amounts */}
            <div className="flex items-center gap-3 flex-wrap">
              {expense.splits.map((split) => (
                <div key={split.profile_id} className="flex flex-col items-center gap-1" title={split.full_name}>
                  <div className="relative">
                    <div
                      className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center ring-2 ring-background",
                        split.profile_id === expense.payer_id
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <span className="text-xs font-semibold">{getInitials(split.full_name)}</span>
                    </div>
                    {/* Payer indicator dot */}
                    {split.profile_id === expense.payer_id && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"
                        aria-hidden
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {formatCurrency(split.amount, expense.currency_code)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side: Amount and Actions */}
          <div className="flex flex-col items-end justify-between gap-3 shrink-0 self-stretch">
            {/* Amount */}
            <div className="text-right">
              <div className="text-xl font-bold text-foreground">
                {formatCurrency(expense.amount_in_base_currency, baseCurrencyCode)}
              </div>
              {expense.currency_code !== baseCurrencyCode && (
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(expense.amount, expense.currency_code)}
                </div>
              )}
            </div>

            {/* Action buttons - always visible */}
            {isOwner && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit();
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Edytuj wydatek"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                )}

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete?.();
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
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
    </div>
  );
};
