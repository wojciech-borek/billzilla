import { Button } from '@/components/ui/button';
import type { InvitationCardVM } from './types';

type InvitationCardProps = {
  invitation: InvitationCardVM;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
  disabled?: boolean;
  error?: string;
};

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

  const formattedDate = invitation.createdAt
    ? formatDate(invitation.createdAt)
    : null;

  return (
    <article
      className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-card p-4 shadow-md shadow-green-100/50 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-green-100 sm:flex-row sm:items-center sm:justify-between"
      aria-label={`Zaproszenie do grupy ${invitation.groupName}`}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20">
            <svg
              className="h-6 w-6 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
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
            <h3 className="truncate text-base font-bold tracking-tight text-foreground">
              {invitation.groupName}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Zaproszenie do grupy
              {formattedDate && (
                <span className="ml-1">
                  • {formattedDate}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="mt-3 rounded-xl bg-destructive/10 p-3 border border-destructive/20"
            role="alert"
          >
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 sm:shrink-0">
        <Button
          onClick={handleDecline}
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-label={`Odrzuć zaproszenie do grupy ${invitation.groupName}`}
        >
          {disabled ? (
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            'Odrzuć'
          )}
        </Button>
        <Button
          onClick={handleAccept}
          size="sm"
          disabled={disabled}
          aria-label={`Akceptuj zaproszenie do grupy ${invitation.groupName}`}
        >
          {disabled ? (
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            'Akceptuj'
          )}
        </Button>
      </div>
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
      return 'Dzisiaj';
    } else if (diffDays === 1) {
      return 'Wczoraj';
    } else if (diffDays < 7) {
      return `${diffDays} dni temu`;
    } else {
      return date.toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  } catch {
    return '';
  }
}

