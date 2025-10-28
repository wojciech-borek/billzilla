import type { InvitationCardVM } from "./types";

interface InvitationCardActionsProps {
  invitation: InvitationCardVM;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
  disabled?: boolean;
}

/**
 * Actions section of the invitation card - accept/decline buttons
 */
export default function InvitationCardActions({
  invitation,
  onAccept,
  onDecline,
  disabled = false,
}: InvitationCardActionsProps) {
  const handleAccept = () => {
    onAccept(invitation.id);
  };

  const handleDecline = () => {
    onDecline(invitation.id);
  };

  return (
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
  );
}
