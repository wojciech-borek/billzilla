import React, { useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useVoiceTranscription } from "@/lib/hooks/useVoiceTranscription";
import { VoiceRecordingIndicator } from "./VoiceRecordingIndicator";
import { VoiceTranscriptionStatus } from "./VoiceTranscriptionStatus";
import type { TranscriptionResultDTO, TranscriptionErrorDTO } from "@/types";

interface VoiceInputButtonProps {
  groupId: string;
  onTranscriptionComplete: (result: TranscriptionResultDTO) => void;
  onTranscriptionError: (error: TranscriptionErrorDTO) => void;
  disabled?: boolean;
  isRecording?: boolean;
  isProcessing?: boolean;
}

/**
 * Voice input button component
 *
 * Button with microphone icon that activates voice recording for expense transcription.
 * Shows recording indicator during recording and transcription status during processing.
 */
export function VoiceInputButton({
  groupId,
  onTranscriptionComplete,
  onTranscriptionError,
  disabled = false,
  isRecording: externalIsRecording = false,
  isProcessing: externalIsProcessing = false,
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
    pollTaskStatus,
    reset,
  } = useVoiceTranscription();

  // Use external state if provided, otherwise use internal
  const currentIsRecording = externalIsRecording || isRecording;
  const currentIsProcessing = externalIsProcessing || isProcessing;

  const handleClick = useCallback(async () => {
    // Don't allow starting recording if already recording or processing
    if (currentIsRecording || currentIsProcessing) {
      return;
    }

    // Don't allow starting if externally disabled
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
  }, [currentIsRecording, currentIsProcessing, disabled, startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      // Stop recording and get audio blob
      const audioBlob = await stopRecording();

      if (!audioBlob) {
        toast.error("Nie udało się zatrzymać nagrywania");
        return;
      }

      // Upload audio for transcription
      const uploadResult = await uploadAudio(audioBlob, groupId);

      // Start polling for transcription status
      await startTranscriptionPolling(uploadResult.task_id);
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

  const startTranscriptionPolling = useCallback(
    async (taskId: string) => {
      try {
        // Poll immediately for the first time
        let status = await pollTaskStatus(taskId);
        
        // Check if already completed
        if (status.status === "completed" && status.result) {
          onTranscriptionComplete(status.result);
          reset();
          return;
        }
        
        if (status.status === "failed" && status.error) {
          onTranscriptionError(status.error);
          reset();
          return;
        }
        
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds timeout

        while (status.status === "processing" && attempts < maxAttempts) {
          // Wait 1 second before next poll
          await new Promise((resolve) => setTimeout(resolve, 1000));

          status = await pollTaskStatus(taskId);
          attempts++;

          if (status.status === "completed") {
            // Success - call completion callback
            if (status.result) {
              onTranscriptionComplete(status.result);
            }
            reset();
            return;
          } else if (status.status === "failed") {
            // Error - call error callback
            if (status.error) {
              onTranscriptionError(status.error);
            } else {
              onTranscriptionError({
                code: "TRANSCRIPTION_FAILED",
                message: "Transkrypcja nie powiodła się",
              });
            }
            reset();
            return;
          }
        }

        // Timeout reached
        if (attempts >= maxAttempts) {
          onTranscriptionError({
            code: "TIMEOUT",
            message: "Przetwarzanie trwa zbyt długo. Spróbuj ponownie.",
          });
          reset();
        }
      } catch (error) {
        console.error("Polling error:", error);
        onTranscriptionError({
          code: "POLLING_ERROR",
          message: "Błąd podczas sprawdzania statusu transkrypcji",
        });
        reset();
      }
    },
    [pollTaskStatus, onTranscriptionComplete, onTranscriptionError, reset]
  );

  // Show recording indicator if currently recording
  if (currentIsRecording) {
    return (
      <VoiceRecordingIndicator
        recordingDuration={recordingDuration}
        onStop={handleStopRecording}
        onCancel={handleCancelRecording}
        maxDuration={60} // 60 seconds max
      />
    );
  }

  // Show transcription status if currently processing
  if (currentIsProcessing) {
    return (
      <VoiceTranscriptionStatus
        taskId={null} // taskId will be managed internally
        onComplete={onTranscriptionComplete}
        onError={onTranscriptionError}
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
      disabled={disabled || currentIsRecording || currentIsProcessing}
      title="Dodaj wydatek głosem"
      className="transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 p-2"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}
