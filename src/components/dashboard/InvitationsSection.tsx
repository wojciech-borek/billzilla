import type { InvitationsQueryState } from "./types";
import { useInvitationManagement } from "./hooks/useInvitationManagement";
import InvitationsLoadingState from "./InvitationsLoadingState";
import InvitationsErrorState from "./InvitationsErrorState";
import InvitationsEmptyState from "./InvitationsEmptyState";
import InvitationsList from "./InvitationsList";

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
  const { processingIds, errors, acceptInvitation, declineInvitation } = useInvitationManagement(query, onChanged);

  // Loading state
  if (query.loading && query.data.length === 0) {
    return <InvitationsLoadingState />;
  }

  // Error state
  if (query.error) {
    return <InvitationsErrorState error={query.error} onRetry={query.refetch} />;
  }

  // Empty state
  if (query.data.length === 0) {
    return <InvitationsEmptyState />;
  }

  // Success state with data
  return (
    <InvitationsList
      invitations={query.data}
      onAccept={acceptInvitation}
      onDecline={declineInvitation}
      processingIds={processingIds}
      errors={errors}
    />
  );
}
