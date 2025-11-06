import { useState, useCallback } from "react";
import type { TranscriptionErrorDTO, TranscriptionResultDTO } from "../../types";
import { useAudioRecorder } from "./useAudioRecorder";
import { useTranscriptionErrorHandler } from "./useTranscriptionErrorHandler";
import { createClient } from "../../db/supabase.client";

/**
 * Internal state for voice transcription management
 */
interface VoiceTranscriptionState {
  /** Whether audio is currently being recorded */
  isRecording: boolean;
  /** Whether the upload/transcription task is being processed */
  isProcessing: boolean;
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
  uploadAudio: (
    audioBlob: Blob,
    groupId: string,
    onComplete: (result: TranscriptionResultDTO) => void,
    onError: (error: TranscriptionErrorDTO) => void
  ) => Promise<void>;
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
 * const { isRecording, startRecording, stopRecording, uploadAudio } = useVoiceTranscription();
 *
 * // Start recording
 * await startRecording();
 *
 * // Stop and upload with callbacks
 * const blob = await stopRecording();
 * if (blob) {
 *   await uploadAudio(blob, groupId, onComplete, onError);
 * }
 * ```
 *
 * @remarks
 * - Maximum file size: 25MB
 * - Minimum recording duration: 1 second
 * - Audio format: webm (fallback to mp4 if unsupported)
 * - Results are handled directly without polling
 *
 * @see {@link useTranscriptionErrorHandler} for error handling
 */
export function useVoiceTranscription(): UseVoiceTranscriptionResult {
  const [state, setState] = useState<VoiceTranscriptionState>({
    isRecording: false,
    isProcessing: false,
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
    async (
      audioBlob: Blob,
      groupId: string,
      onComplete: (result: TranscriptionResultDTO) => void,
      onError: (error: TranscriptionErrorDTO) => void
    ): Promise<void> => {
      // Validate audio blob size (max 25MB as per plan)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (audioBlob.size > maxSize) {
        const error = errorHandler.createError("FILE_TOO_LARGE");
        setState((prev) => ({ ...prev, error }));
        errorHandler.handleError(error);
        onError(error);
        return;
      }

      // Validate minimum recording duration (1 second as per plan)
      if (audioRecorder.duration < 1) {
        const error = errorHandler.createError("RECORDING_TOO_SHORT");
        setState((prev) => ({ ...prev, error }));
        errorHandler.handleError(error);
        onError(error);
        return;
      }

      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        // Pobierz access token z Supabase
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("group_id", groupId);

        const response = await fetch("/api/expenses/transcribe", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
        });

        if (!response.ok) {
          let error: TranscriptionErrorDTO;

          // For 400 errors (validation), try to parse the specific error from response body
          if (response.status === 400) {
            try {
              const errorData = await response.json();
              error = {
                code: errorData.error?.code || "INVALID_REQUEST",
                message: errorData.error?.message || "Nieprawidłowe dane",
              };
            } catch {
              // Fallback to generic error if parsing fails
              error = errorHandler.handleHttpError(response.status);
            }
          } else {
            error = errorHandler.handleHttpError(response.status);
          }

          setState((prev) => ({ ...prev, isProcessing: false, error }));
          errorHandler.handleError(error);
          onError(error);
          return;
        }

        const data: TranscriptionResultDTO = await response.json();

        // Directly handle the result - synchronous processing!
        setState((prev) => ({ ...prev, isProcessing: false }));
        onComplete(data);
      } catch (error) {
        // Otherwise, handle as network error
        const transcriptionError = errorHandler.handleNetworkError(error);
        setState((prev) => ({ ...prev, isProcessing: false, error: transcriptionError }));
        errorHandler.handleError(transcriptionError);
        onError(transcriptionError);
      }
    },
    [audioRecorder.duration, errorHandler]
  );

  const reset = useCallback(() => {
    setState({
      isRecording: false,
      isProcessing: false,
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
