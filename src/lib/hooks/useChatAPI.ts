/**
 * useChatAPI Hook
 *
 * React hook for interacting with the AI Chat API
 * Handles sending messages, managing conversation state, and processing responses
 */

import { useState, useCallback } from "react";
import type { ChatMessage, ChatResponse } from "@/lib/ai/chatTypes";

interface UseChatAPIOptions {
  groupId: string;
  onError?: (error: Error) => void;
}

interface UseChatAPIReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

export function useChatAPI({ groupId, onError }: UseChatAPIOptions): UseChatAPIReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: "user_text",
        content: message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        // Call API
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            group_id: groupId === "general" ? null : groupId,
            ...(conversationId && { conversation_id: conversationId }),
            message,
            context: {
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              language: "pl",
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to send message");
        }

        const data: ChatResponse = await response.json();

        // Update conversation ID
        if (!conversationId) {
          setConversationId(data.conversation_id);
        }

        // Update messages with full conversation history
        setMessages(data.messages);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);

        // Add error message to chat
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          type: "ai_error",
          content: "",
          timestamp: new Date(),
          metadata: {
            error: errorMessage,
          },
        };

        setMessages((prev) => [...prev, errorMsg]);

        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [groupId, conversationId, onError]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
