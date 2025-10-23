import React from "react";
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useTranscriptionPolling } from "@/lib/hooks/useTranscriptionPolling";
import type { TranscriptionResultDTO, TranscriptionErrorDTO } from "@/types";

/**
 * Props for VoiceTranscriptionStatus component
 */
interface VoiceTranscriptionStatusProps {
  /** ID of the transcription task to monitor */
  taskId: string;
  /** Callback invoked when transcription completes successfully */
  onComplete: (result: TranscriptionResultDTO) => void;
  /** Callback invoked when transcription fails or times out */
  onError: (error: TranscriptionErrorDTO) => void;
  /** Polling interval in milliseconds (default: 1000) */
  pollingInterval?: number;
}

/**
 * Voice transcription status component
 *
 * Displays the current status of a transcription task with visual feedback.
 * Automatically polls the server for updates and shows appropriate UI for each state:
 *
 * - **Processing**: Animated spinner with progress bar and phase messages
 * - **Completed**: Success icon with confirmation message
 * - **Failed**: Error icon with message and retry button
 * - **Timeout**: Warning icon with message and retry button
 *
 * @example
 * ```tsx
 * <VoiceTranscriptionStatus
 *   taskId="task-123"
 *   onComplete={(result) => {
 *     console.log('Transcription:', result.transcription);
 *     setExpenseData(result.expense_data);
 *   }}
 *   onError={(error) => {
 *     toast.error(error.message);
 *   }}
 * />
 * ```
 *
 * @remarks
 * - Polling begins automatically on mount
 * - Status updates occur every pollingInterval milliseconds
 * - Maximum polling duration: 60 seconds
 * - Progress messages change based on processing phase
 */
export function VoiceTranscriptionStatus({
  taskId,
  onComplete,
  onError,
  pollingInterval = 1000,
}: VoiceTranscriptionStatusProps) {
  const { status, currentMessage, progress, error, pollingCount, canRetry, retry } = useTranscriptionPolling({
    taskId,
    pollingInterval,
    maxAttempts: 60,
    onComplete,
    onError,
  });

  // Render based on status
  const renderContent = () => {
    switch (status) {
      case "idle":
        return null;

      case "processing":
        return (
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{currentMessage}</p>
              <p className="text-xs text-muted-foreground mt-1">Próba {pollingCount + 1} z 60</p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );

      case "completed":
        return (
          <div className="flex flex-col items-center space-y-3">
            <CheckCircle className="h-8 w-8 text-green-600" />

            <div className="text-center">
              <p className="text-sm font-medium text-green-600">{currentMessage}</p>
            </div>
          </div>
        );

      case "failed":
      case "timeout":
        return (
          <div className="flex flex-col items-center space-y-3">
            {status === "timeout" ? (
              <AlertCircle className="h-8 w-8 text-amber-600" />
            ) : (
              <XCircle className="h-8 w-8 text-destructive" />
            )}

            <div className="text-center">
              <p className="text-sm font-medium text-destructive">{currentMessage}</p>
              {error && <p className="text-xs text-muted-foreground mt-1">{error.message}</p>}
            </div>

            {canRetry && (
              <Button type="button" variant="outline" size="sm" onClick={retry} className="text-xs h-8">
                <RefreshCw className="h-3 w-3 mr-1" />
                Spróbuj ponownie
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-48 bg-primary/5 border-primary/20">
      <CardContent className="p-4">{renderContent()}</CardContent>
    </Card>
  );
}
