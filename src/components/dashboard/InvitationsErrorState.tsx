interface InvitationsErrorStateProps {
  error: string;
  onRetry: () => void;
}

/**
 * Error state component for invitations section
 */
export default function InvitationsErrorState({ error, onRetry }: InvitationsErrorStateProps) {
  return (
    <section aria-labelledby="invitations-heading">
      <h2 id="invitations-heading" className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Zaproszenia
      </h2>
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6">
        <div className="flex items-start gap-3">
          <svg
            className="h-6 w-6 text-destructive shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-base font-bold text-destructive">Błąd podczas ładowania zaproszeń</h3>
            <p className="mt-2 text-sm text-destructive/80">{error}</p>
            <button
              onClick={onRetry}
              className="mt-4 text-sm font-medium text-destructive underline hover:text-destructive/80 transition-colors"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
