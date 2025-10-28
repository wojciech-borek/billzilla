import React from "react";
import { Button } from "@/components/ui/button";
import { Divide } from "lucide-react";

interface SplitActionsProps {
  totalAmount: number;
  currentSum: number;
  remaining: number;
  currencyCode: string;
  onSplitEvenly: () => void;
}

export function SplitActions({ totalAmount, currentSum, remaining, currencyCode, onSplitEvenly }: SplitActionsProps) {
  return (
    <div className="flex justify-between items-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onSplitEvenly}
        disabled={totalAmount <= 0}
        className="flex items-center gap-2"
      >
        <Divide className="h-4 w-4" />
        Podziel po równo
      </Button>

      {totalAmount > 0 && (
        <div className="text-sm text-muted-foreground">
          Razem: {currentSum.toFixed(2)} {currencyCode}
          {remaining !== 0 && (
            <span className={remaining > 0 ? "text-orange-600" : "text-red-600"}>
              {" "}
              ({remaining > 0 ? "+" : ""}
              {remaining.toFixed(2)})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
