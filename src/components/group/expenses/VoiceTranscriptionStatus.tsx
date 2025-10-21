import React, { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { getTranscriptionTaskStatus } from "@/lib/services/expenseTranscriptionService";
import type { TranscriptionResultDTO, TranscriptionErrorDTO, TranscribeTaskStatusDTO } from "@/types";

interface VoiceTranscriptionStatusProps {
  taskId: string;
  onComplete: (result: TranscriptionResultDTO) => void;
  onError: (error: TranscriptionErrorDTO) => void;
  pollingInterval?: number; // interwał odpytywania w ms (domyślnie 1000)
}

/**
 * Voice transcription status component
 *
 * Shows processing status with progress indicator, polls transcription task status,
 * and handles completion/error states with appropriate UI feedback.
 */
export function VoiceTranscriptionStatus({
  taskId,
  onComplete,
  onError,
  pollingInterval = 1000,
}: VoiceTranscriptionStatusProps) {
  const [status, setStatus] = useState<"processing" | "completed" | "failed" | "timeout">("processing");
  const [currentMessage, setCurrentMessage] = useState("Przygotowywanie...");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<TranscriptionErrorDTO | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [canRetry, setCanRetry] = useState(false);

  const maxPollingAttempts = 60; // 60 seconds timeout

  // Messages for different phases
  const getMessageForPhase = (attempt: number): string => {
    if (attempt < 10) {
      return "Transkrybuję nagranie...";
    } else if (attempt < 30) {
      return "Analizuję dane wydatku...";
    } else {
      return "Finalizuję przetwarzanie...";
    }
  };

  // Poll transcription status
  const pollStatus = useCallback(async () => {
    if (!taskId) return;

    try {
      const response: TranscribeTaskStatusDTO = await getTranscriptionTaskStatus(taskId);

      if (response.status === "completed" && response.result) {
        setStatus("completed");
        setCurrentMessage("Przetwarzanie zakończone pomyślnie!");
        setProgress(100);
        onComplete(response.result);
        return;
      }

      if (response.status === "failed" && response.error) {
        setStatus("failed");
        setError(response.error);
        setCurrentMessage("Przetwarzanie nie powiodło się");
        setProgress(0);
        onError(response.error);
        setCanRetry(true);
        return;
      }

      // Still processing - update progress and message
      const newPollingCount = pollingCount + 1;
      setPollingCount(newPollingCount);
      setCurrentMessage(getMessageForPhase(newPollingCount));
      setProgress(Math.min((newPollingCount / 30) * 100, 90)); // Max 90% until completion
    } catch (err) {
      console.error("Polling error:", err);
      const transcriptionError: TranscriptionErrorDTO = {
        code: "POLLING_ERROR",
        message: "Błąd podczas sprawdzania statusu",
      };
      setStatus("failed");
      setError(transcriptionError);
      setCurrentMessage("Błąd połączenia");
      onError(transcriptionError);
      setCanRetry(true);
    }
  }, [taskId, pollingCount, onComplete, onError]);

  // Start polling when component mounts or taskId changes
  useEffect(() => {
    if (!taskId) return;

    setStatus("processing");
    setCurrentMessage("Przygotowywanie...");
    setProgress(0);
    setError(null);
    setPollingCount(0);
    setCanRetry(false);

    // Poll immediately
    pollStatus();

    // Set up polling interval
    const interval = setInterval(() => {
      setPollingCount((prev) => {
        const newCount = prev + 1;

        // Check for timeout
        if (newCount >= maxPollingAttempts) {
          clearInterval(interval);
          setStatus("timeout");
          setCurrentMessage("Przetwarzanie trwa zbyt długo");
          const timeoutError: TranscriptionErrorDTO = {
            code: "TIMEOUT",
            message: "Przetwarzanie trwa zbyt długo. Spróbuj ponownie.",
          };
          setError(timeoutError);
          onError(timeoutError);
          setCanRetry(true);
          return newCount;
        }

        return newCount;
      });

      pollStatus();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [taskId, pollingInterval, pollStatus]);

  const handleRetry = useCallback(() => {
    if (!taskId) return;

    setStatus("processing");
    setCurrentMessage("Przygotowywanie...");
    setProgress(0);
    setError(null);
    setPollingCount(0);
    setCanRetry(false);

    // Restart polling
    pollStatus();
  }, [taskId, pollStatus]);

  // Render based on status
  const renderContent = () => {
    switch (status) {
      case "processing":
        return (
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{currentMessage}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Próba {pollingCount + 1} z {maxPollingAttempts}
              </p>
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
              <Button type="button" variant="outline" size="sm" onClick={handleRetry} className="text-xs h-8">
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
