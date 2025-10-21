import React, { useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useVoiceTranscription } from "@/lib/hooks/useVoiceTranscription";
import { VoiceRecordingIndicator } from "./VoiceRecordingIndicator";
import { VoiceTranscriptionStatus } from "./VoiceTranscriptionStatus";
import type { TranscriptionResultDTO, TranscriptionErrorDTO } from "@/types";

/**
 * Props for VoiceInputButton component
 */
interface VoiceInputButtonProps {
  /** ID of the group to associate the expense with */
  groupId: string;
  /** Callback invoked when transcription completes successfully */
  onTranscriptionComplete: (result: TranscriptionResultDTO) => void;
  /** Callback invoked when transcription fails */
  onTranscriptionError: (error: TranscriptionErrorDTO) => void;
  /** Whether the button should be disabled */
  disabled?: boolean;
}

/**
 * Voice input button component for expense transcription
 *
 * A button that initiates voice recording for creating expenses. The component
 * manages the full voice-to-expense flow by orchestrating multiple states:
 *
 * 1. **Idle state**: Shows microphone button
 * 2. **Recording state**: Shows recording indicator with duration and controls
 * 3. **Processing state**: Shows transcription status with progress
 * 4. **Error state**: Shows retry button
 *
 * @example
 * ```tsx
 * <VoiceInputButton
 *   groupId={group.id}
 *   onTranscriptionComplete={(result) => {
 *     setFormData(result.expense_data);
 *   }}
 *   onTranscriptionError={(error) => {
 *     console.error('Transcription failed:', error.message);
 *   }}
 * />
 * ```
 *
 * @remarks
 * - Requires microphone permission from the user
 * - Maximum recording duration: 60 seconds
 * - Minimum recording duration: 1 second
 * - Maximum file size: 25MB
 * - Auto-resets state after completion or error
 */
export function VoiceInputButton({
  groupId,
  onTranscriptionComplete,
  onTranscriptionError,
  disabled = false,
}: VoiceInputButtonProps) {
  const {
    isRecording,
    isProcessing,
    recordingDuration,
    taskId,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadAudio,
    reset,
  } = useVoiceTranscription();

  // ALL HOOKS MUST BE DEFINED BEFORE ANY CONDITIONAL RETURNS
  const handleClick = useCallback(async () => {
    // Don't allow starting recording if already recording or processing
    if (isRecording || isProcessing) {
      return;
    }

    // Don't allow starting if disabled
    if (disabled) {
      return;
    }

    try {
      // Start recording
      await startRecording();
    } catch (error) {
      // Error is handled in the hook
      console.error("Failed to start recording:", error);
    }
  }, [isRecording, isProcessing, disabled, startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      // Stop recording and get audio blob
      const audioBlob = await stopRecording();

      if (!audioBlob) {
        toast.error("Nie udało się zatrzymać nagrywania");
        return;
      }

      // Upload audio for transcription
      // The upload will set taskId in the hook state, which will trigger
      // VoiceTranscriptionStatus component to show and handle polling
      await uploadAudio(audioBlob, groupId);
    } catch (error) {
      console.error("Failed to stop recording:", error);
      toast.error("Błąd podczas zatrzymywania nagrywania");
      reset();
    }
  }, [stopRecording, uploadAudio, groupId, reset]);

  const handleCancelRecording = useCallback(() => {
    cancelRecording();
    toast.info("Nagrywanie anulowane");
  }, [cancelRecording]);

  // Wrap callbacks to reset state after completion
  const handleTranscriptionComplete = useCallback(
    (result: TranscriptionResultDTO) => {
      onTranscriptionComplete(result);
      reset();
    },
    [onTranscriptionComplete, reset]
  );

  const handleTranscriptionError = useCallback(
    (error: TranscriptionErrorDTO) => {
      onTranscriptionError(error);
      reset();
    },
    [onTranscriptionError, reset]
  );

  // CONDITIONAL RENDERING AFTER ALL HOOKS
  // Show recording indicator if currently recording
  if (isRecording) {
    return (
      <VoiceRecordingIndicator
        recordingDuration={recordingDuration}
        onStop={handleStopRecording}
        onCancel={handleCancelRecording}
        maxDuration={60} // 60 seconds max
      />
    );
  }

  // Show transcription status if currently processing and we have a taskId
  if (isProcessing && taskId) {
    return (
      <VoiceTranscriptionStatus
        taskId={taskId}
        onComplete={handleTranscriptionComplete}
        onError={handleTranscriptionError}
        pollingInterval={1000}
      />
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={() => reset()}
        className="text-destructive hover:text-destructive px-4 py-2"
        title="Rozpocznij nowe nagrywanie"
      >
        <MicOff className="h-4 w-4 mr-2" />
        Spróbuj ponownie
      </Button>
    );
  }

  // Default idle state
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled || isRecording || isProcessing}
      title="Dodaj wydatek głosem"
      className="transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 p-2"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}
