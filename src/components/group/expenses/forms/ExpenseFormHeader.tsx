import React from "react";
import { Mic, AlertTriangle } from "lucide-react";

interface ExpenseFormHeaderProps {
  isFromVoice?: boolean;
  hasLowConfidence?: boolean;
}

/**
 * Header component for expense form showing voice input badges
 */
export function ExpenseFormHeader({ isFromVoice = false, hasLowConfidence = false }: ExpenseFormHeaderProps) {
  if (!isFromVoice) {
    return null;
  }

  return (
    <div className="flex justify-center gap-2 flex-wrap">
      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent border border-accent/30">
        <Mic className="h-3 w-3 mr-1" />
        Wypełnione głosem
      </div>
      {hasLowConfidence && (
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Niska pewność
        </div>
      )}
    </div>
  );
}
