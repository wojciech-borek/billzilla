import type { InvitationCardVM } from "./types";
import InvitationCardActions from "./InvitationCardActions";
import InvitationCardContent from "./InvitationCardContent";
import InvitationCardError from "./InvitationCardError";

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
  return (
    <article
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/5"
      aria-label={`Zaproszenie do grupy ${invitation.groupName}`}
    >
      <InvitationCardContent invitation={invitation} />

      <InvitationCardActions invitation={invitation} onAccept={onAccept} onDecline={onDecline} disabled={disabled} />

      {error && <InvitationCardError error={error} />}
    </article>
  );
}
