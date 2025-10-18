import { Button } from '@/components/ui/button';

type DashboardEmptyStateProps = {
  onCreateGroup: () => void;
};

/**
 * Global empty state for dashboard
 * Displayed when user has no groups and no invitations
 */
export default function DashboardEmptyState({ onCreateGroup }: DashboardEmptyStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-2xl bg-secondary/20 shadow-lg shadow-green-100">
          <svg
            className="h-16 w-16 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>

        {/* Content */}
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
          Witaj w Billzilla!
        </h1>
        <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
          Nie masz jeszcze żadnych grup. Utwórz swoją pierwszą grupę, aby zacząć dzielić wydatki
          z przyjaciółmi i rodziną.
        </p>

        {/* Action button */}
        <Button onClick={onCreateGroup} size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300">
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Utwórz pierwszą grupę
        </Button>

        {/* Additional info */}
        <p className="mt-8 text-sm text-muted-foreground">
          Możesz też poczekać na zaproszenie do istniejącej grupy
        </p>
      </div>
    </div>
  );
}

