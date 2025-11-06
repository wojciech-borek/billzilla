import React, { useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useVoiceTranscription } from "@/lib/hooks/useVoiceTranscription";
import { VoiceRecordingIndicator } from "./VoiceRecordingIndicator";
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
    } catch {
      // Error is handled in the hook
    }
  }, [isRecording, isProcessing, disabled, startRecording]);

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

  const handleStopRecording = useCallback(async () => {
    try {
      // Stop recording and get audio blob
      const audioBlob = await stopRecording();

      if (!audioBlob) {
        toast.error("Nie udało się zatrzymać nagrywania");
        return;
      }

      // Upload audio for transcription - directly handles result
      await uploadAudio(audioBlob, groupId, handleTranscriptionComplete, handleTranscriptionError);
    } catch {
      toast.error("Błąd podczas zatrzymywania nagrywania");
      reset();
    }
  }, [stopRecording, uploadAudio, groupId, reset, handleTranscriptionComplete, handleTranscriptionError]);

  const handleCancelRecording = useCallback(() => {
    cancelRecording();
    toast.info("Nagrywanie anulowane");
  }, [cancelRecording]);

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

  // Show processing state while uploading/transcribing
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center space-y-3 p-4">
        <div className="relative">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Przetwarzam nagranie...</p>
          <p className="text-xs text-muted-foreground mt-1">Może zająć do 30 sekund</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => reset()}
        className="text-destructive hover:text-destructive"
        title={`Błąd: ${error.message}. Kliknij aby spróbować ponownie.`}
      >
        <MicOff className="h-4 w-4" />
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
