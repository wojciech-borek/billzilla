/**
 * ErrorCard Component
 *
 * Displays error messages in chat with retry option
 * Supports different error types based on HTTP status codes
 */

import { CHAT_TEXTS } from "@/lib/ai/chatTexts";
import { AlertCircle } from "lucide-react";

interface ErrorCardProps {
  error: string;
  statusCode?: number;
  onRetry?: () => void;
}

export function ErrorCard({ error, statusCode, onRetry }: ErrorCardProps) {
  // Get user-friendly error message based on status code
  const errorMessage = statusCode
    ? CHAT_TEXTS.errors[statusCode as keyof typeof CHAT_TEXTS.errors] || CHAT_TEXTS.errors.default
    : error || CHAT_TEXTS.errors.default;

  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Error icon */}
        <div className="w-10 h-10 bg-destructive rounded-full flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-destructive-foreground" />
        </div>

        <div className="flex-1">
          <p className="font-semibold text-destructive mb-1">Nie udało się przetworzyć zapytania</p>
          <p className="text-sm text-destructive/90">{errorMessage}</p>

          {/* Retry button */}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm text-destructive font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 rounded"
            >
              {CHAT_TEXTS.labels.retry}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
