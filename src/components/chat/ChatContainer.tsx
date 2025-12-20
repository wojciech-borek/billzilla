/**
 * ChatContainer Component
 *
 * Main chat wrapper that integrates all chat components:
 * - Chat messages list with auto-scroll
 * - Chat input
 * - Header with group info
 *
 * This is the main component to embed in pages
 */

import { useState, useRef, useEffect } from "react";
import type { ChatMessage as ChatMessageType } from "@/lib/ai/chatTypes";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatContainerProps {
  groupId: string;
  groupName: string;
  onSendMessage?: (message: string) => Promise<void>;
  initialMessages?: ChatMessageType[];
}

export function ChatContainer({ groupName, onSendMessage, initialMessages = [] }: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Create user message
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      type: "user_text",
      content,
      timestamp: new Date(),
      metadata: { isLoading: true },
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call parent handler if provided
      if (onSendMessage) {
        await onSendMessage(content);
      }

      // Update user message to show as sent
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, metadata: { ...msg.metadata, isLoading: false } } : msg
        )
      );

      // TODO: In real implementation, this would be handled by WebSocket/SSE
      // For now, we'll add a placeholder AI response
      const aiMessage: ChatMessageType = {
        id: `ai-${Date.now()}`,
        type: "ai_text",
        content: "Rozumiem. Przetwarzam twoje zapytanie...",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (_error) {
      // Add error message
      const errorMessage: ChatMessageType = {
        id: `error-${Date.now()}`,
        type: "ai_error",
        content: "",
        timestamp: new Date(),
        metadata: {
          error: "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
        },
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    // TODO: Implement retry logic
    console.log("Retry last message");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">AI Financial Assistant</h2>
            <p className="text-sm text-muted-foreground">{groupName}</p>
          </div>
          {/* Optional: Add settings or close button */}
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Witaj w czacie AI!</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Zadaj pytanie o wydatki, salda uczestników, trendy finansowe lub poproś o analizę danych grupy.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} onRetry={handleRetry} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
