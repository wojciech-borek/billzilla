/**
 * ChatContainer Component
 *
 * Main chat wrapper that integrates all chat components with real API
 */

import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useChatAPI } from "@/lib/hooks/useChatAPI";

interface ChatContainerProps {
  groupId: string;
  groupName: string;
}

export function ChatContainer({ groupId, groupName }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage } = useChatAPI({ groupId });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const handleRetry = () => {
    // TODO: Implement retry logic for failed messages
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
