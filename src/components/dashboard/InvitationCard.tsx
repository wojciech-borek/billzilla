import type { InvitationCardVM } from "./types";

interface InvitationCardProps {
  invitation: InvitationCardVM;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
  disabled?: boolean;
  error?: string;
}

/**
 * Invitation card component
 * Displays invitation with accept/decline actions
 */
export default function InvitationCard({
  invitation,
  onAccept,
  onDecline,
  disabled = false,
  error,
}: InvitationCardProps) {
  const handleAccept = () => {
    onAccept(invitation.id);
  };

  const handleDecline = () => {
    onDecline(invitation.id);
  };

  const formattedDate = invitation.createdAt ? formatDate(invitation.createdAt) : null;

  return (
    <article
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/5"
      aria-label={`Zaproszenie do grupy ${invitation.groupName}`}
    >
      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/20">
        <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h3 className="truncate text-sm font-medium text-foreground">{invitation.groupName}</h3>
        <p className="text-xs text-muted-foreground">
          Zaproszenie do grupy
          {formattedDate && <span className="ml-1">• {formattedDate}</span>}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        <button
          onClick={handleDecline}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Odrzuć zaproszenie do grupy ${invitation.groupName}`}
        >
          {disabled ? (
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
        <button
          onClick={handleAccept}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Akceptuj zaproszenie do grupy ${invitation.groupName}`}
        >
          {disabled ? (
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="absolute bottom-full left-0 right-0 mb-1 rounded-md bg-destructive/10 p-2 border border-destructive/20"
          role="alert"
        >
          <p className="text-xs text-destructive font-medium">{error}</p>
        </div>
      )}
    </article>
  );
}

/**
 * Format ISO date string to relative or absolute format
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Dzisiaj";
    } else if (diffDays === 1) {
      return "Wczoraj";
    } else if (diffDays < 7) {
      return `${diffDays} dni temu`;
    } else {
      return date.toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  } catch {
    return "";
  }
}
