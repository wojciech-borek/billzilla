import React, { useRef } from "react";
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
  const splitsContainerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

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
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = splitsContainerRef.current;
    if (!container) return;
    if (event.pointerType === "mouse" && event.buttons !== 1) return;

    isDraggingRef.current = true;
    startXRef.current = event.clientX;
    scrollLeftRef.current = container.scrollLeft;
    container.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const container = splitsContainerRef.current;
    if (!container) return;
    event.preventDefault();
    const delta = startXRef.current - event.clientX;
    container.scrollLeft = scrollLeftRef.current + delta;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    splitsContainerRef.current?.releasePointerCapture?.(event.pointerId);
  };

  return (
    <div className="relative">
      <div
        className="absolute left-2 top-4 h-4 w-4 rounded-full bg-primary/70 shadow-sm ring-4 ring-primary/12"
        aria-hidden
      />
      {showConnector && <div className="absolute left-[18px] top-8 bottom-0 w-0.5 bg-border/60" aria-hidden />}

      <div
        className="ml-8 rounded-xl border border-border/50 bg-card p-3 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)] transition-shadow duration-200 hover:shadow-[0_14px_40px_-16px_rgba(0,0,0,0.32)] focus-within:ring-2 focus-within:ring-ring"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`Wydatek: ${expense.description}, kwota: ${formatCurrency(expense.amount_in_base_currency, baseCurrencyCode)}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 leading-none">
                {formattedTime}
              </span>
              <h4 className="text-[16px] font-semibold text-foreground leading-tight">{expense.description}</h4>
            </div>

            <div
              className="mt-2 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none touch-pan-x"
              aria-label="Podział wydatku"
              role="list"
              ref={splitsContainerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {expense.splits.map((split) => (
                <div
                  key={split.profile_id}
                  className="min-w-[72px] flex flex-col items-center gap-1 px-2 py-1 text-center"
                >
                  <div className="relative">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground",
                        split.profile_id === expense.payer_id && "bg-primary/10 text-primary"
                      )}
                    >
                      {getInitials(split.full_name)}
                    </span>
                    {split.profile_id === expense.payer_id && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary/70 ring-2 ring-background"
                        aria-hidden
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-full bg-primary/5 px-2 py-1 text-[11px] font-semibold text-foreground",
                      split.profile_id === expense.payer_id && "bg-primary/12 text-primary"
                    )}
                  >
                    {formatCurrency(split.amount, expense.currency_code)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end justify-center gap-1.5 shrink-0 self-stretch">
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

            <div className="flex items-center gap-2 mt-2">
              {isOwner && (
                <>
                  {onEdit && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit();
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-muted-foreground/70 transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
