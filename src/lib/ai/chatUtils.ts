/**
 * Chat utility functions
 *
 * Helper functions for chat message processing and formatting
 */

import type { ChatMessage, FunctionName } from "./chatTypes";

/**
 * Generate unique message ID using UUID v4
 */
export function generateMessageId(): string {
  return crypto.randomUUID();
}

/**
 * Create a user text message
 */
export function createUserMessage(content: string): ChatMessage {
  return {
    id: generateMessageId(),
    type: "user_text",
    content,
    timestamp: new Date(),
  };
}

/**
 * Create an AI text response message
 */
export function createAITextMessage(content: string): ChatMessage {
  return {
    id: generateMessageId(),
    type: "ai_text",
    content,
    timestamp: new Date(),
  };
}

/**
 * Create a function call loading message
 */
export function createFunctionCallMessage(functionName: FunctionName): ChatMessage {
  return {
    id: generateMessageId(),
    type: "ai_function_call",
    content: "",
    timestamp: new Date(),
    metadata: {
      functionName,
      isLoading: true,
    },
  };
}

/**
 * Create an error message
 */
export function createErrorMessage(error: string): ChatMessage {
  return {
    id: generateMessageId(),
    type: "ai_error",
    content: "",
    timestamp: new Date(),
    metadata: {
      error,
    },
  };
}

/**
 * Create a system info message
 */
export function createSystemMessage(content: string): ChatMessage {
  return {
    id: generateMessageId(),
    type: "system_info",
    content,
    timestamp: new Date(),
  };
}

/**
 * Format timestamp for display
 */
export function formatMessageTime(timestamp: Date): string {
  return timestamp.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Check if two messages are from the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Group messages by date for display
 */
export function groupMessagesByDate(messages: ChatMessage[]): { date: string; messages: ChatMessage[] }[] {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate: Date | null = null;
  let currentGroup: ChatMessage[] = [];

  messages.forEach((message) => {
    const messageDate = new Date(message.timestamp);

    if (!currentDate || !isSameDay(currentDate, messageDate)) {
      if (currentGroup.length > 0 && currentDate) {
        groups.push({
          date: formatDateHeader(currentDate),
          messages: currentGroup,
        });
      }
      currentDate = messageDate;
      currentGroup = [message];
    } else {
      currentGroup.push(message);
    }
  });

  if (currentGroup.length > 0 && currentDate) {
    groups.push({
      date: formatDateHeader(currentDate),
      messages: currentGroup,
    });
  }

  return groups;
}

/**
 * Format date for group header
 */
function formatDateHeader(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return "Dziś";
  } else if (isSameDay(date, yesterday)) {
    return "Wczoraj";
  } else {
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
}
