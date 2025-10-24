import { useState, useRef, useCallback } from "react";

interface AudioRecorderState {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
}

type UseAudioRecorderResult = AudioRecorderState & {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  cancelRecording: () => void;
  reset: () => void;
};

/**
 * Hook for managing low-level audio recording using Web Audio API (MediaRecorder)
 *
 * Handles microphone permissions, recording state, timer, and audio blob creation.
 */
export function useAudioRecorder(): UseAudioRecorderResult {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    duration: 0,
    audioBlob: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission and get stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create MediaRecorder with preferred format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop event
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        setState((prev) => ({ ...prev, isRecording: false, audioBlob }));

        // Clean up timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      };

      // Handle recording errors
      mediaRecorder.onerror = (event) => {
        setState((prev) => ({
          ...prev,
          isRecording: false,
          error: "Błąd podczas nagrywania",
        }));

        // Clean up timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every 1 second
      setState((prev) => ({
        ...prev,
        isRecording: true,
        duration: 0,
        audioBlob: null,
        error: null,
      }));

      // Start duration timer
      timerRef.current = setInterval(() => {
        setState((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";

      let userFriendlyMessage = "Nie udało się uzyskać dostępu do mikrofonu";
      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        userFriendlyMessage = "Brak dostępu do mikrofonu. Sprawdź ustawienia przeglądarki.";
      } else if (errorMessage.includes("NotFoundError")) {
        userFriendlyMessage = "Nie znaleziono mikrofonu. Sprawdź podłączenie urządzenia.";
      } else if (errorMessage.includes("NotSupportedError")) {
        userFriendlyMessage = "Nagrywanie audio nie jest obsługiwane w tej przeglądarce.";
      }

      setState((prev) => ({
        ...prev,
        error: userFriendlyMessage,
      }));

      throw error;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve(null);
        return;
      }

      // Set up one-time stop handler to resolve the promise
      const handleStop = () => {
        mediaRecorder.removeEventListener("stop", handleStop);
        const audioBlob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        resolve(audioBlob);
      };

      mediaRecorder.addEventListener("stop", handleStop);
      mediaRecorder.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      // Tracks will be stopped in onstop handler
    }

    // Clean up timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Clear chunks
    chunksRef.current = [];

    // Reset state
    setState({
      isRecording: false,
      duration: 0,
      audioBlob: null,
      error: null,
    });
  }, []);

  const reset = useCallback(() => {
    cancelRecording();
  }, [cancelRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  };
}
