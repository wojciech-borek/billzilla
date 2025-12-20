/**
 * ChatMessage Component
 *
 * Renders a single chat message with appropriate styling based on type:
 * - user_text: User message bubble
 * - ai_text: AI text response
 * - ai_function_call: Loading state for function execution
 * - ai_function_result: SmartCard component based on function type
 * - ai_error: Error card
 */

import { Suspense } from "react";
import type { ChatMessage as ChatMessageType, FunctionName } from "@/lib/ai/chatTypes";
import { getComponentMapping } from "@/lib/ai/chatComponentMapping";
import { ChatDataTransformer } from "@/lib/ai/ChatDataTransformer";
import { FunctionCallLoadingCard } from "./loading/FunctionCallLoadingCard";
import { TypingIndicator } from "./loading/TypingIndicator";
import { ErrorCard } from "./errors/ErrorCard";

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: () => void;
}

export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  // User message - text bubble aligned right
  if (message.type === "user_text") {
    const isLoading = message.metadata?.isLoading;

    return (
      <div className="flex justify-end mb-4">
        <div
          className={`bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-md shadow-sm transition-opacity ${
            isLoading ? "opacity-60" : ""
          }`}
        >
          <p className="text-sm">{message.content as string}</p>

          {/* Mini spinner when sending */}
          {isLoading && (
            <div className="flex justify-end mt-1">
              <div className="animate-spin h-3 w-3 border border-primary-foreground border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // AI function call - show loading state
  if (message.type === "ai_function_call" && message.metadata?.isLoading) {
    const functionName = message.metadata.functionName as FunctionName;

    return (
      <div className="mb-4">
        <FunctionCallLoadingCard functionName={functionName} />
      </div>
    );
  }

  // AI function result - render SmartCard
  if (message.type === "ai_function_result") {
    const functionName = message.metadata?.functionName as FunctionName;
    const mapping = getComponentMapping(functionName);

    if (!mapping) {
      // Fallback - render JSON (dev mode)
      return (
        <div className="mb-4 bg-muted p-4 rounded-xl">
          <pre className="text-xs overflow-x-auto">{JSON.stringify(message.content, null, 2)}</pre>
        </div>
      );
    }

    const SmartCardComponent = mapping.component;
    const transformedData = ChatDataTransformer.transform(functionName, message.content);

    return (
      <div className="mb-4">
        <Suspense fallback={<FunctionCallLoadingCard functionName={functionName} />}>
          <SmartCardComponent data={transformedData} />
        </Suspense>
      </div>
    );
  }

  // AI text response
  if (message.type === "ai_text") {
    const isTyping = message.metadata?.isLoading;

    if (isTyping) {
      return <TypingIndicator />;
    }

    return (
      <div className="flex items-start gap-3 mb-4">
        {/* AI Avatar */}
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <span className="text-secondary-foreground font-bold text-sm">AI</span>
        </div>

        <div className="bg-background border border-border rounded-2xl rounded-tl-sm px-4 py-3 max-w-2xl">
          <p className="text-sm text-foreground leading-relaxed">{message.content as string}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (message.type === "ai_error") {
    return <ErrorCard error={message.metadata?.error || "Nieznany błąd"} onRetry={onRetry} />;
  }

  // System info
  if (message.type === "system_info") {
    return (
      <div className="mb-4 text-center">
        <p className="text-xs text-muted-foreground">{message.content as string}</p>
      </div>
    );
  }

  return null;
}
