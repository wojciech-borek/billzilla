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
      <h2 id="invitations-heading" className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Zaproszenia
      </h2>
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
