import React from "react";
import { Separator } from "@/components/ui/separator";

interface SplitSummaryProps {
  hasParticipants: boolean;
  participantCount: number;
  remaining: number;
  currencyCode: string;
}

export function SplitSummary({ hasParticipants, participantCount, remaining, currencyCode }: SplitSummaryProps) {
  if (!hasParticipants) return null;

  return (
    <>
      <Separator />
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">Uczestników: {participantCount}</span>
        <span
          className={`font-medium ${
            remaining === 0 ? "text-green-600" : remaining > 0 ? "text-orange-600" : "text-red-600"
          }`}
        >
          {remaining === 0
            ? "Kwoty się zgadzają"
            : remaining > 0
              ? `Do podziału: ${remaining.toFixed(2)} ${currencyCode}`
              : `Nadwyżka: ${Math.abs(remaining).toFixed(2)} ${currencyCode}`}
        </span>
      </div>
    </>
  );
}
