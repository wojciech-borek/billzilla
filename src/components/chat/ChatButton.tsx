/**
 * ChatButton Component
 *
 * Floating Action Button (FAB) that opens AI chat slide-in panel
 * Panel slides in from the right side of the screen
 */

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { ChatContainer } from "./ChatContainer";

interface ChatButtonProps {
  groupId?: string;
  groupName?: string;
}

export function ChatButton({ groupId, groupName }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-24 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Otwórz czat AI"
      >
        <MessageSquare className="h-6 w-6" />

        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-in Panel from Right */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-2xl transform bg-background shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="AI Chat Assistant"
      >
        {isOpen && (
          <div className="flex flex-col h-full">
            {/* Close button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Zamknij czat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Container */}
            <ChatContainer groupId={groupId || "general"} groupName={groupName || "Dashboard"} />
          </div>
        )}
      </div>
    </>
  );
}
