import React, { useEffect, useState } from "react";
import { Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceRecordingIndicatorProps {
  recordingDuration: number; // w sekundach
  onStop: () => void;
  onCancel: () => void;
  maxDuration?: number; // maksymalny czas nagrania (np. 60s)
}

/**
 * Voice recording indicator component
 *
 * Shows animated microphone icon, recording timer, and control buttons during active recording.
 */
export function VoiceRecordingIndicator({
  recordingDuration,
  onStop,
  onCancel,
  maxDuration = 60,
}: VoiceRecordingIndicatorProps) {
  const [canStop, setCanStop] = useState(false);

  // Enable stop button after minimum recording time (0.5 seconds as per plan)
  useEffect(() => {
    if (recordingDuration >= 0.5) {
      setCanStop(true);
    } else {
      setCanStop(false);
    }
  }, [recordingDuration]);

  // Auto-stop recording when max duration is reached
  useEffect(() => {
    if (recordingDuration >= maxDuration) {
      onStop();
    }
  }, [recordingDuration, maxDuration, onStop]);


  return (
    <div className="flex items-center space-x-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCancel}
        className="p-2 border-muted-foreground/30 hover:bg-muted"
        title="Anuluj nagrywanie"
      >
        <X className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onStop}
        disabled={!canStop}
        className="p-2"
        title={!canStop ? "Nagrywaj przynajmniej 0.5 sekundy" : "Zatrzymaj nagrywanie"}
      >
        <Square className="h-4 w-4" />
      </Button>
    </div>
  );
}
