/**
 * DataTableCard Component
 *
 * Universal card for displaying tabular/list data
 * Use cases:
 * - Expense lists
 * - Member balances
 * - Transaction history
 * - Any structured data
 */

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface DataTableCardData {
  title: string;
  badge?: {
    label: string;
    value: string | number;
  };
  searchKeyword?: string;
  columns: {
    key: string;
    label: string;
    align?: "left" | "right" | "center";
  }[];
  rows: {
    id: string;
    data: Record<string, unknown>;
    avatar?: {
      url?: string;
      fallback: string;
    };
    onClick?: () => void;
  }[];
  emptyMessage?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface DataTableCardProps {
  data: DataTableCardData;
}

export default function DataTableCard({ data }: DataTableCardProps) {
  const { title, badge, searchKeyword, columns, rows, emptyMessage, action } = data;

  // Format cell value
  const formatValue = (value: unknown): string => {
    if (typeof value === "number") {
      return value.toLocaleString("pl-PL", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    if (value instanceof Date) {
      return value.toLocaleDateString("pl-PL");
    }
    return String(value || "");
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground text-lg">{title}</h3>
        {badge && (
          <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">
            {badge.label}: {badge.value}
          </span>
        )}
      </div>

      {/* Search keyword */}
      {searchKeyword && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 bg-accent/20 text-accent px-3 py-1.5 rounded-lg text-sm font-semibold">
            🔍 &ldquo;{searchKeyword}&rdquo;
          </span>
        </div>
      )}

      {/* Table/List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {!rows || rows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">{emptyMessage || "Brak danych"}</p>
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className={`border border-border rounded-xl p-3 transition-all ${
                row.onClick ? "hover:shadow-md hover:border-primary/20 cursor-pointer" : ""
              }`}
              onClick={row.onClick}
              onKeyDown={(e) => {
                if (row.onClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  row.onClick();
                }
              }}
              role={row.onClick ? "button" : undefined}
              tabIndex={row.onClick ? 0 : undefined}
            >
              <div className="flex items-center gap-3">
                {/* Avatar if provided */}
                {row.avatar && (
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    {row.avatar.url && <AvatarImage src={row.avatar.url} alt={row.avatar.fallback} />}
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {row.avatar.fallback}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Data columns */}
                <div className="flex-1 grid grid-cols-1 gap-1">
                  {(columns || []).map((col) => {
                    const value = row.data ? row.data[col.key] : undefined;
                    const align = col.align || "left";

                    return (
                      <div
                        key={col.key}
                        className={`flex ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"}`}
                      >
                        {col.key === "main" ? (
                          <span className="font-semibold text-foreground">{formatValue(value)}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">{formatValue(value)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action button */}
      {action && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
