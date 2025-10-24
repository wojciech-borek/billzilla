import { useState, useEffect, useCallback, useRef } from "react";
import type { TranscriptionResultDTO, TranscriptionErrorDTO, TranscribeTaskStatusDTO } from "../../types";
import { getTranscriptionTaskStatus } from "../services/expenseTranscriptionService";

/**
 * Configuration options for transcription polling
 */
interface UseTranscriptionPollingOptions {
  /** ID of the transcription task to poll (null to stop polling) */
  taskId: string | null;
  /** Interval between polling requests in milliseconds (default: 1000) */
  pollingInterval?: number;
  /** Maximum number of polling attempts before timeout (default: 60) */
  maxAttempts?: number;
  /** Callback invoked when transcription completes successfully */
  onComplete: (result: TranscriptionResultDTO) => void;
  /** Callback invoked when transcription fails or times out */
  onError: (error: TranscriptionErrorDTO) => void;
}

/**
 * Internal state for polling management
 */
interface PollingState {
  /** Current status of the polling operation */
  status: "idle" | "processing" | "completed" | "failed" | "timeout";
  /** User-friendly message describing current phase */
  currentMessage: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error details if status is 'failed' or 'timeout' */
  error: TranscriptionErrorDTO | null;
  /** Number of polling attempts made so far */
  pollingCount: number;
  /** Whether the operation can be retried */
  canRetry: boolean;
}

/**
 * Hook for managing transcription task polling
 *
 * Automatically polls the transcription service for task status updates,
 * manages progress indication, detects timeouts, and handles completion/error states.
 *
 * @example
 * ```tsx
 * const { status, progress, currentMessage, retry } = useTranscriptionPolling({
 *   taskId: 'task-123',
 *   pollingInterval: 1000,
 *   maxAttempts: 60,
 *   onComplete: (result) => {
 *     console.log('Transcription:', result.transcription);
 *     console.log('Expense data:', result.expense_data);
 *   },
 *   onError: (error) => {
 *     console.error('Failed:', error.message);
 *   },
 * });
 * ```
 *
 * @remarks
 * - Polling starts automatically when taskId is provided
 * - Stops polling on completion, failure, or timeout
 * - Progress is estimated based on polling attempts
 * - User messages change based on processing phase
 * - Timeout occurs after maxAttempts polling cycles
 *
 * @see {@link useVoiceTranscription} for recording and upload
 */
export function useTranscriptionPolling({
  taskId,
  pollingInterval = 1000,
  maxAttempts = 60,
  onComplete,
  onError,
}: UseTranscriptionPollingOptions) {
  const [state, setState] = useState<PollingState>({
    status: "idle",
    currentMessage: "Przygotowywanie...",
    progress: 0,
    error: null,
    pollingCount: 0,
    canRetry: false,
  });

  const pollingCountRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  // Keep refs up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  // Get message based on polling attempt count
  const getMessageForPhase = useCallback((attempt: number): string => {
    if (attempt < 10) {
      return "Transkrybuję nagranie...";
    } else if (attempt < 30) {
      return "Analizuję dane wydatku...";
    } else {
      return "Finalizuję przetwarzanie...";
    }
  }, []);

  // Retry polling
  const retry = useCallback(() => {
    if (!taskId) return;

    setState({
      status: "processing",
      currentMessage: "Przygotowywanie...",
      progress: 0,
      error: null,
      pollingCount: 0,
      canRetry: false,
    });
    pollingCountRef.current = 0;
  }, [taskId]);

  // Main polling effect
  useEffect(() => {
    if (!taskId) {
      setState((prev) => ({ ...prev, status: "idle" }));
      return;
    }

    // Reset state when taskId changes
    setState({
      status: "processing",
      currentMessage: "Przygotowywanie...",
      progress: 0,
      error: null,
      pollingCount: 0,
      canRetry: false,
    });
    pollingCountRef.current = 0;

    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const pollStatus = async () => {
      if (!isMounted) return false;

      try {
        const response: TranscribeTaskStatusDTO = await getTranscriptionTaskStatus(taskId);

        if (!isMounted) return false;

        if (response.status === "completed" && response.result) {
          setState({
            status: "completed",
            currentMessage: "Przetwarzanie zakończone pomyślnie!",
            progress: 100,
            error: null,
            pollingCount: pollingCountRef.current,
            canRetry: false,
          });
          onCompleteRef.current(response.result);
          return false; // Stop polling
        }

        if (response.status === "failed" && response.error) {
          setState({
            status: "failed",
            currentMessage: "Przetwarzanie nie powiodło się",
            progress: 0,
            error: response.error,
            pollingCount: pollingCountRef.current,
            canRetry: true,
          });
          onErrorRef.current(response.error);
          return false; // Stop polling
        }

        // Still processing - update progress and message
        pollingCountRef.current += 1;
        setState({
          status: "processing",
          currentMessage: getMessageForPhase(pollingCountRef.current),
          progress: Math.min((pollingCountRef.current / 30) * 100, 90),
          error: null,
          pollingCount: pollingCountRef.current,
          canRetry: false,
        });

        return true; // Continue polling
      } catch (err) {
        if (!isMounted) return false;

        const transcriptionError: TranscriptionErrorDTO = {
          code: "POLLING_ERROR",
          message: "Błąd podczas sprawdzania statusu",
        };
        setState({
          status: "failed",
          currentMessage: "Błąd połączenia",
          progress: 0,
          error: transcriptionError,
          pollingCount: pollingCountRef.current,
          canRetry: true,
        });
        onErrorRef.current(transcriptionError);
        return false; // Stop polling
      }
    };

    const startPolling = async () => {
      // Poll immediately
      const shouldContinue = await pollStatus();

      if (!shouldContinue || !isMounted) {
        return;
      }

      // Set up polling interval
      intervalId = setInterval(async () => {
        // Check for timeout
        if (pollingCountRef.current >= maxAttempts) {
          if (intervalId) clearInterval(intervalId);

          const timeoutError: TranscriptionErrorDTO = {
            code: "TIMEOUT",
            message: "Przetwarzanie trwa zbyt długo. Spróbuj ponownie.",
          };

          setState({
            status: "timeout",
            currentMessage: "Przetwarzanie trwa zbyt długo",
            progress: 0,
            error: timeoutError,
            pollingCount: pollingCountRef.current,
            canRetry: true,
          });
          onErrorRef.current(timeoutError);
          return;
        }

        const shouldContinuePolling = await pollStatus();

        // Stop polling if task is complete or failed
        if (!shouldContinuePolling && intervalId) {
          clearInterval(intervalId);
        }
      }, pollingInterval);
    };

    startPolling();

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId, pollingInterval, maxAttempts, getMessageForPhase]);

  return {
    ...state,
    retry,
  };
}
