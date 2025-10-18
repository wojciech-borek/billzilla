import { useMemo, useCallback, useState, useEffect } from 'react';
import { useGroupsList } from './hooks/useGroupsList';
import { useInvitationsList } from './hooks/useInvitationsList';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import InvitationsSection from './InvitationsSection';
import GroupsSection from './GroupsSection';
import DashboardEmptyState from './DashboardEmptyState';
import FloatingActionButton from './FloatingActionButton';
import PullToRefreshIndicator from './PullToRefreshIndicator';
import CreateGroupModal from '../group/CreateGroupModal';
import { Toaster } from '../ui/sonner';
import { toast } from 'sonner';
import type { CreateGroupSuccessResult } from '../../lib/schemas/groupSchemas';

type DashboardViewProps = {
  groupsLimit?: number;
};

/**
 * Main Dashboard view component
 * Coordinates two independent sections: Invitations and Groups
 * Shows global empty state when both sections are empty
 * Supports pull-to-refresh and infinite scroll
 */
export default function DashboardView({
  groupsLimit = 20,
}: DashboardViewProps = {}) {
  const groupsQuery = useGroupsList({
    status: 'active',
    limit: groupsLimit,
  });

  const invitationsQuery = useInvitationsList();

  // Modal state synchronized with URL parameter
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Sync modal state with URL parameter on mount and URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldOpen = params.get('modal') === 'create-group';
    setIsCreateModalOpen(shouldOpen);
  }, []);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([groupsQuery.refetch(), invitationsQuery.refetch()]);
  }, [groupsQuery, invitationsQuery]);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: true,
  });

  const viewState = useMemo(() => {
    const hasAnyGroups = groupsQuery.data.length > 0;
    const hasAnyInvitations = invitationsQuery.data.length > 0;
    const isLoading = groupsQuery.loading || invitationsQuery.loading;

    return {
      hasAnyGroups,
      hasAnyInvitations,
      showEmptyState: !hasAnyGroups && !hasAnyInvitations && !isLoading,
    };
  }, [
    groupsQuery.data.length,
    groupsQuery.loading,
    invitationsQuery.data.length,
    invitationsQuery.loading,
  ]);

  const handleInvitationChanged = async () => {
    // Refetch both sections when invitation is accepted
    await Promise.all([groupsQuery.refetch(), invitationsQuery.refetch()]);
  };

  const handleCreateGroup = () => {
    // Open modal by adding URL parameter
    const url = new URL(window.location.href);
    url.searchParams.set('modal', 'create-group');
    window.history.pushState({}, '', url.toString());
    setIsCreateModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsCreateModalOpen(open);
    
    // Update URL when modal closes
    if (!open) {
      const url = new URL(window.location.href);
      url.searchParams.delete('modal');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleCreateSuccess = async (result: CreateGroupSuccessResult) => {
    // Show success toast
    const addedCount = result.invitations.added_members.length;
    const invitedCount = result.invitations.created_invitations.length;
    
    let message = `Grupa "${result.groupName}" została utworzona!`;
    if (addedCount > 0 || invitedCount > 0) {
      message += ` Dodano ${addedCount} członków i wysłano ${invitedCount} zaproszeń.`;
    }
    
    toast.success('Sukces!', {
      description: message,
      duration: 5000,
    });

    // Refresh groups list
    await groupsQuery.refetch();

    // Optional: Navigate to the new group (if route exists)
    // window.location.href = `/groups/${result.groupId}`;
  };

  // Show global empty state when no data in both sections
  if (viewState.showEmptyState) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardEmptyState onCreateGroup={handleCreateGroup} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Pull to refresh indicator */}
      <PullToRefreshIndicator
        pullDistance={pullToRefresh.pullDistance}
        isRefreshing={pullToRefresh.isRefreshing}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Main content - Two independent sections */}
        <div className="space-y-8">
          {/* Invitations Section */}
          {(viewState.hasAnyInvitations || invitationsQuery.loading) && (
            <InvitationsSection
              query={invitationsQuery}
              onChanged={handleInvitationChanged}
            />
          )}

          {/* Groups Section */}
          <GroupsSection query={groupsQuery} />
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={handleCreateGroup} />

      {/* Create Group Modal */}
      <CreateGroupModal
        open={isCreateModalOpen}
        onOpenChange={handleModalOpenChange}
        onSuccess={handleCreateSuccess}
      />

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

