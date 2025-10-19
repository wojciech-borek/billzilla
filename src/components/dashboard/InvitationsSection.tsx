import { useState } from "react";
import type { InvitationsQueryState } from "./types";
import InvitationCard from "./InvitationCard";
import SectionEmptyState from "./SectionEmptyState";

interface InvitationsSectionProps {
  query: InvitationsQueryState & {
    refetch: () => Promise<void>;
    accept: (id: string) => Promise<{ success: boolean; error?: string }>;
    decline: (id: string) => Promise<{ success: boolean; error?: string }>;
  };
  onChanged?: () => void;
}

/**
 * Invitations section component
 * Displays pending invitations with accept/decline actions
 */
export default function InvitationsSection({ query, onChanged }: InvitationsSectionProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const handleAccept = async (id: string) => {
    // Lock the card during processing
    setProcessingIds((prev) => new Set(prev).add(id));
    setErrors((prev) => {
      const newErrors = new Map(prev);
      newErrors.delete(id);
      return newErrors;
    });

    const result = await query.accept(id);

    if (result.success) {
      // Show success toast (optional - could use a toast library)
      console.log("Zaproszenie zaakceptowane");
      // Notify parent to refetch groups
      onChanged?.();
    } else {
      // Show error on the card
      setErrors((prev) => new Map(prev).set(id, result.error || "Nieznany błąd"));
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDecline = async (id: string) => {
    // Lock the card during processing
    setProcessingIds((prev) => new Set(prev).add(id));
    setErrors((prev) => {
      const newErrors = new Map(prev);
      newErrors.delete(id);
      return newErrors;
    });

    const result = await query.decline(id);

    if (result.success) {
      // Show success toast (optional)
      console.log("Zaproszenie odrzucone");
    } else {
      // Show error on the card
      setErrors((prev) => new Map(prev).set(id, result.error || "Nieznany błąd"));
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleRetry = () => {
    query.refetch();
  };

  // Loading state
  if (query.loading && query.data.length === 0) {
    return (
      <section aria-labelledby="invitations-heading">
        <h2 id="invitations-heading" className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          Zaproszenia
        </h2>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/50" aria-hidden="true" />
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (query.error) {
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
              <p className="mt-2 text-sm text-destructive/80">{query.error}</p>
              <button
                onClick={handleRetry}
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

  // Empty state
  if (query.data.length === 0) {
    return (
      <section aria-labelledby="invitations-heading">
        <h2 id="invitations-heading" className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          Zaproszenia
        </h2>
        <SectionEmptyState title="Brak zaproszeń" description="Nie masz żadnych oczekujących zaproszeń do grup." />
      </section>
    );
  }

  // Success state with data
  return (
    <section aria-labelledby="invitations-heading">
      <h2 id="invitations-heading" className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Zaproszenia
      </h2>
      <div className="space-y-2">
        {query.data.map((invitation) => (
          <InvitationCard
            key={invitation.id}
            invitation={invitation}
            onAccept={handleAccept}
            onDecline={handleDecline}
            disabled={processingIds.has(invitation.id)}
            error={errors.get(invitation.id)}
          />
        ))}
      </div>
    </section>
  );
}
