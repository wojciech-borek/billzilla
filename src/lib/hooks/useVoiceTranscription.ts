import { useState, useCallback } from "react";
import type { TranscriptionErrorDTO, TranscribeTaskResponseDTO } from "../../types";
import { useAudioRecorder } from "./useAudioRecorder";
import { useTranscriptionErrorHandler } from "./useTranscriptionErrorHandler";

/**
 * Internal state for voice transcription management
 */
interface VoiceTranscriptionState {
  /** Whether audio is currently being recorded */
  isRecording: boolean;
  /** Whether the upload/transcription task is being processed */
  isProcessing: boolean;
  /** ID of the transcription task (null if not yet uploaded) */
  taskId: string | null;
  /** Current error state, if any */
  error: TranscriptionErrorDTO | null;
}

/**
 * Return type for useVoiceTranscription hook
 */
type UseVoiceTranscriptionResult = VoiceTranscriptionState & {
  /** Current recording duration in seconds */
  recordingDuration: number;
  /** Start audio recording. Throws on microphone access failure. */
  startRecording: () => Promise<void>;
  /** Stop recording and return audio blob. Throws on recording failure. */
  stopRecording: () => Promise<Blob | null>;
  /** Cancel ongoing recording and reset state */
  cancelRecording: () => void;
  /** Upload audio blob for transcription. Validates size and duration. */
  uploadAudio: (audioBlob: Blob, groupId: string) => Promise<TranscribeTaskResponseDTO>;
  /** Reset all state to initial values */
  reset: () => void;
};

/**
 * Hook for managing voice recording and upload for transcription
 *
 * This hook orchestrates the recording and upload phases of voice-to-expense conversion.
 * It manages recording state, validates audio constraints, and handles upload to the
 * transcription service.
 *
 * @example
 * ```tsx
 * const { isRecording, startRecording, stopRecording, uploadAudio, taskId } = useVoiceTranscription();
 *
 * // Start recording
 * await startRecording();
 *
 * // Stop and upload
 * const blob = await stopRecording();
 * if (blob) {
 *   await uploadAudio(blob, groupId);
 *   // Use taskId for polling
 * }
 * ```
 *
 * @remarks
 * - Maximum file size: 25MB
 * - Minimum recording duration: 1 second
 * - Audio format: webm (fallback to mp4 if unsupported)
 * - Polling for results is handled by VoiceTranscriptionStatus component
 *
 * @see {@link useTranscriptionPolling} for polling task status
 * @see {@link useTranscriptionErrorHandler} for error handling
 */
export function useVoiceTranscription(): UseVoiceTranscriptionResult {
  const [state, setState] = useState<VoiceTranscriptionState>({
    isRecording: false,
    isProcessing: false,
    taskId: null,
    error: null,
  });

  const audioRecorder = useAudioRecorder();
  const errorHandler = useTranscriptionErrorHandler();

  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));
      await audioRecorder.startRecording();
      setState((prev) => ({ ...prev, isRecording: true }));
    } catch (error) {
      // Convert audio recorder error to transcription error format
      const transcriptionError = errorHandler.createError("MICROPHONE_ERROR", audioRecorder.error || undefined);

      setState((prev) => ({
        ...prev,
        error: transcriptionError,
      }));

      errorHandler.handleError(transcriptionError);
      throw error;
    }
  }, [audioRecorder, errorHandler]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    try {
      const audioBlob = await audioRecorder.stopRecording();
      setState((prev) => ({ ...prev, isRecording: false }));

      return audioBlob;
    } catch (error) {
      const transcriptionError = errorHandler.createError("RECORDING_ERROR");

      setState((prev) => ({
        ...prev,
        isRecording: false,
        error: transcriptionError,
      }));

      errorHandler.handleError(transcriptionError);
      throw error;
    }
  }, [audioRecorder, errorHandler]);

  const cancelRecording = useCallback(() => {
    audioRecorder.cancelRecording();
    setState((prev) => ({
      ...prev,
      isRecording: false,
      isProcessing: false,
      error: null,
    }));
  }, [audioRecorder]);

  const uploadAudio = useCallback(
    async (audioBlob: Blob, groupId: string): Promise<TranscribeTaskResponseDTO> => {
      // Validate audio blob size (max 25MB as per plan)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (audioBlob.size > maxSize) {
        const error = errorHandler.createError("FILE_TOO_LARGE");
        setState((prev) => ({ ...prev, error }));
        errorHandler.handleError(error);
        throw new Error(error.message);
      }

      // Validate minimum recording duration (1 second as per plan)
      if (audioRecorder.duration < 1) {
        const error = errorHandler.createError("RECORDING_TOO_SHORT");
        setState((prev) => ({ ...prev, error }));
        errorHandler.handleError(error);
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
          const error = errorHandler.handleHttpError(response.status);
          setState((prev) => ({ ...prev, isProcessing: false, error }));
          errorHandler.handleError(error);
          throw new Error(error.message);
        }

        const data: TranscribeTaskResponseDTO = await response.json();
        setState((prev) => ({ ...prev, taskId: data.task_id }));

        return data;
      } catch (error) {
        // If it's already a network error we threw, just re-throw
        if (error instanceof Error && error.message.includes("Błąd")) {
          throw error;
        }

        // Otherwise, handle as network error
        const transcriptionError = errorHandler.handleNetworkError(error);
        setState((prev) => ({ ...prev, isProcessing: false, error: transcriptionError }));
        errorHandler.handleError(transcriptionError);
        throw error;
      }
    },
    [audioRecorder.duration, errorHandler]
  );

  const reset = useCallback(() => {
    setState({
      isRecording: false,
      isProcessing: false,
      taskId: null,
      error: null,
    });
    audioRecorder.reset();
  }, [audioRecorder]);

  return {
    ...state,
    recordingDuration: audioRecorder.duration,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadAudio,
    reset,
  };
}
