import { useState, useCallback, useRef } from "react";
import type {
  TranscriptionResultDTO,
  TranscriptionErrorDTO,
  TranscribeTaskStatusDTO,
  TranscribeTaskResponseDTO,
} from "../../types";
import { useAudioRecorder } from "./useAudioRecorder";

interface VoiceTranscriptionState {
  isRecording: boolean;
  isProcessing: boolean;
  recordingDuration: number;
  taskId: string | null;
  error: TranscriptionErrorDTO | null;
}

type UseVoiceTranscriptionResult = VoiceTranscriptionState & {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  uploadAudio: (audioBlob: Blob, groupId: string) => Promise<TranscribeTaskResponseDTO>;
  pollTaskStatus: (taskId: string) => Promise<TranscribeTaskStatusDTO>;
  reset: () => void;
};

/**
 * Hook for managing the complete voice transcription process
 *
 * Handles recording, uploading, polling, and error management for voice-to-expense conversion.
 */
export function useVoiceTranscription(): UseVoiceTranscriptionResult {
  const [state, setState] = useState<VoiceTranscriptionState>({
    isRecording: false,
    isProcessing: false,
    recordingDuration: 0,
    taskId: null,
    error: null,
  });

  const audioRecorder = useAudioRecorder();
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));
      await audioRecorder.startRecording();
      setState((prev) => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error("Failed to start recording:", error);

      // Convert audio recorder error to transcription error format
      const transcriptionError: TranscriptionErrorDTO = {
        code: "MICROPHONE_ERROR",
        message: audioRecorder.error || "Nie udało się uzyskać dostępu do mikrofonu",
      };

      setState((prev) => ({
        ...prev,
        error: transcriptionError,
      }));

      throw error;
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async () => {
    try {
      const audioBlob = await audioRecorder.stopRecording();
      setState((prev) => ({ ...prev, isRecording: false }));

      return audioBlob;
    } catch (error) {
      console.error("Failed to stop recording:", error);
      setState((prev) => ({
        ...prev,
        isRecording: false,
        error: {
          code: "RECORDING_ERROR",
          message: "Błąd podczas zatrzymywania nagrywania",
        },
      }));
      throw error;
    }
  }, [audioRecorder]);

  const cancelRecording = useCallback(() => {
    audioRecorder.cancelRecording();
    setState((prev) => ({
      ...prev,
      isRecording: false,
      isProcessing: false,
      error: null,
    }));

    // Clean up polling
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
  }, [audioRecorder]);

  const uploadAudio = useCallback(
    async (audioBlob: Blob, groupId: string): Promise<TranscribeTaskResponseDTO> => {
      // Validate audio blob size (max 25MB as per plan)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (audioBlob.size > maxSize) {
        const error: TranscriptionErrorDTO = {
          code: "FILE_TOO_LARGE",
          message: "Nagranie jest zbyt duże. Maksymalny rozmiar: 25MB.",
        };
        setState((prev) => ({ ...prev, error }));
        throw new Error(error.message);
      }

      // Validate minimum recording duration (1 second as per plan)
      if (audioRecorder.duration < 1) {
        const error: TranscriptionErrorDTO = {
          code: "RECORDING_TOO_SHORT",
          message: "Nagranie jest zbyt krótkie. Powiedz więcej szczegółów.",
        };
        setState((prev) => ({ ...prev, error }));
        throw new Error(error.message);
      }

      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("group_id", groupId);

        const response = await fetch("/api/expenses/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          let error: TranscriptionErrorDTO;

          if (response.status === 400) {
            error = {
              code: "INVALID_REQUEST",
              message: "Nieprawidłowe dane nagrania",
            };
          } else if (response.status === 401) {
            error = {
              code: "UNAUTHORIZED",
              message: "Brak autoryzacji",
            };
          } else if (response.status === 403) {
            error = {
              code: "FORBIDDEN",
              message: "Brak dostępu do grupy",
            };
          } else if (response.status === 413) {
            error = {
              code: "FILE_TOO_LARGE",
              message: "Nagranie zbyt duże. Maksymalny rozmiar: 25MB.",
            };
          } else if (response.status === 503) {
            error = {
              code: "SERVICE_UNAVAILABLE",
              message: "Usługa transkrypcji jest tymczasowo niedostępna",
            };
          } else {
            error = {
              code: "UPLOAD_FAILED",
              message: "Nie udało się wysłać nagrania",
            };
          }

          setState((prev) => ({ ...prev, isProcessing: false, error }));
          throw new Error(error.message);
        }

        const data: TranscribeTaskResponseDTO = await response.json();
        setState((prev) => ({ ...prev, taskId: data.task_id }));

        return data;
      } catch (error) {
        const transcriptionError: TranscriptionErrorDTO = {
          code: "UPLOAD_FAILED",
          message: error instanceof Error ? error.message : "Nie udało się wysłać nagrania",
        };

        setState((prev) => ({ ...prev, isProcessing: false, error: transcriptionError }));
        throw error;
      }
    },
    [audioRecorder.duration]
  );

  const pollTaskStatus = useCallback(async (taskId: string): Promise<TranscribeTaskStatusDTO> => {
    try {
      const response = await fetch(`/api/expenses/transcribe/${taskId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Zadanie transkrypcji nie zostało znalezione");
        } else if (response.status === 401) {
          throw new Error("Brak autoryzacji do sprawdzenia statusu");
        } else {
          throw new Error("Błąd podczas sprawdzania statusu zadania");
        }
      }

      const data: TranscribeTaskStatusDTO = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to poll task status:", error);
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isRecording: false,
      isProcessing: false,
      recordingDuration: 0,
      taskId: null,
      error: null,
    });
    audioRecorder.reset();

    // Clean up polling
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
  }, [audioRecorder]);

  return {
    ...state,
    recordingDuration: audioRecorder.duration,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadAudio,
    pollTaskStatus,
    reset,
  };
}
