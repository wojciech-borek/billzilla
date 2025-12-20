/**
 * TypingIndicator Component
 *
 * Shows animated dots when AI is typing a text response
 * Classic "..." animation with staggered bounce effect
 */

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-4">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-sm">AI</span>
      </div>

      {/* Typing indicator bubble */}
      <div className="bg-background border border-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div
            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
