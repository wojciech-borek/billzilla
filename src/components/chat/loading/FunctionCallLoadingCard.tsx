/**
 * FunctionCallLoadingCard Component
 *
 * Displays a loading state when AI is calling a function
 * Shows spinner, function name, and contextual loading text
 */

import type { FunctionName } from "@/lib/ai/chatTypes";
import { getLoadingText } from "@/lib/ai/chatComponentMapping";

interface FunctionCallLoadingCardProps {
  functionName: FunctionName;
  loadingText?: string;
}

export function FunctionCallLoadingCard({ functionName, loadingText }: FunctionCallLoadingCardProps) {
  const displayText = loadingText || getLoadingText(functionName);

  return (
    <div className="bg-primary/5 border-l-4 border-primary rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Spinner animation */}
        <div className="relative">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>

        {/* Status text */}
        <div>
          <p className="font-semibold text-foreground text-sm">{displayText}</p>
          <p className="text-sm text-muted-foreground">
            Funkcja: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{functionName}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
