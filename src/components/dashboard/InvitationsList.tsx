import type { InvitationCardVM } from "./types";
import InvitationCard from "./InvitationCard";

interface InvitationsListProps {
  invitations: InvitationCardVM[];
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
  processingIds: Set<string>;
  errors: Map<string, string>;
}

/**
 * List component for invitations
 */
export default function InvitationsList({
  invitations,
  onAccept,
  onDecline,
  processingIds,
  errors,
}: InvitationsListProps) {
  return (
    <section aria-labelledby="invitations-heading">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 id="invitations-heading" className="text-2xl font-bold tracking-tight text-foreground">
          Zaproszenia
        </h2>
      </div>
      <div className="space-y-2">
        {invitations.map((invitation) => (
          <InvitationCard
            key={invitation.id}
            invitation={invitation}
            onAccept={onAccept}
            onDecline={onDecline}
            disabled={processingIds.has(invitation.id)}
            error={errors.get(invitation.id)}
          />
        ))}
      </div>
    </section>
  );
}
