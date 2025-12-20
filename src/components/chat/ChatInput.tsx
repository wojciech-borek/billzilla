/**
 * ChatInput Component
 *
 * Input field for user to type chat messages
 * Includes send button and keyboard shortcuts (Enter to send)
 */

import { useState, useCallback, type KeyboardEvent, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSendMessage, disabled = false, placeholder = "Zadaj pytanie..." }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage(trimmedMessage);
    setMessage(""); // Clear input after sending
  }, [message, disabled, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Enter (without Shift)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      handleSend();
    },
    [handleSend]
  );

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-background">
      <div className="flex items-end gap-2 p-4">
        {/* Text input */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Wiadomość czatu"
        />

        {/* Send button */}
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !message.trim()}
          className="rounded-xl h-12 w-12 flex-shrink-0"
          aria-label="Wyślij wiadomość"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <div className="px-4 pb-3 text-xs text-muted-foreground">
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">
          Enter
        </kbd>{" "}
        aby wysłać,{" "}
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">
          Shift + Enter
        </kbd>{" "}
        dla nowej linii
      </div>
    </form>
  );
}
