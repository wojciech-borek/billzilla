import { useCallback, useState } from "react";
import { useGroupsList } from "./hooks/useGroupsList";
import { useInvitationsList } from "./hooks/useInvitationsList";
import { usePullToRefresh } from "./hooks/usePullToRefresh";
import InvitationsSection from "./InvitationsSection";
import GroupsSection from "./GroupsSection";
import FloatingActionButton from "./FloatingActionButton";
import PullToRefreshIndicator from "./PullToRefreshIndicator";
import CreateGroupModal from "../group/CreateGroupModal";
import { AddExpenseModal } from "../group/expenses/AddExpenseModal";
import { Toaster } from "../ui/sonner";
import { Button } from "../ui/button";
import { toast } from "sonner";
import type { CreateGroupSuccessResult } from "../../lib/schemas/groupSchemas";
import type { ExpenseDTO, GroupMemberDTO, GroupCurrencyDTO, GroupMemberSummaryDTO } from "../../types";

interface DashboardViewProps {
  groupsLimit?: number;
  currentUserId: string;
}

/**
 * Main Dashboard view component
 * Coordinates two independent sections: Invitations and Groups
 * Shows global empty state when both sections are empty
 * Supports pull-to-refresh and infinite scroll
 */
export default function DashboardView({ groupsLimit = 20, currentUserId }: DashboardViewProps) {
  const groupsQuery = useGroupsList({
    status: "active",
    limit: groupsLimit,
  });

  const invitationsQuery = useInvitationsList();

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExpenseGroupId, setSelectedExpenseGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMemberSummaryDTO[]>([]);
  const [groupCurrencies, setGroupCurrencies] = useState<GroupCurrencyDTO[]>([]);
  const [isExpenseModalLoading, setIsExpenseModalLoading] = useState(false);

  // Pull to refresh
  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([groupsQuery.refetch(), invitationsQuery.refetch()]);
  }, [groupsQuery, invitationsQuery]);

  const handleCreateGroup = () => {
    setIsCreateModalOpen(true);
  };

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: true,
  });

  const hasAnyGroups = groupsQuery.data.length > 0;

  const handleInvitationChanged = async () => {
    // Refetch both sections when invitation is accepted
    await Promise.all([groupsQuery.refetch(), invitationsQuery.refetch()]);
  };

  const handleAddExpense = async (groupId: string) => {
    setIsExpenseModalLoading(true);
    try {
      // Load group details
      const response = await fetch(`/api/groups/${groupId}`);
      if (!response.ok) {
        throw new Error("Nie udało się załadować danych grupy");
      }

      const groupData = await response.json();
      setGroupMembers(
        (groupData.members || []).map((member: GroupMemberDTO) => ({
          profile_id: member.profile_id,
          full_name: member.full_name,
          avatar_url: member.avatar_url,
          status: member.status,
          role: member.role,
        }))
      );
      setGroupCurrencies(groupData.group_currencies || []);
      setSelectedExpenseGroupId(groupId);
    } catch (error) {
      toast.error("Nie udało się załadować danych grupy");
    } finally {
      setIsExpenseModalLoading(false);
    }
  };

  const handleExpenseModalClose = () => {
    setSelectedExpenseGroupId(null);
    setGroupMembers([]);
    setGroupCurrencies([]);
  };

  const handleExpenseSuccess = async () => {
    // Refetch groups to update balances
    await groupsQuery.refetch();
    handleExpenseModalClose();
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsCreateModalOpen(open);
  };

  const handleCreateSuccess = async (result: CreateGroupSuccessResult) => {
    // Show success toast
    const addedCount = result.invitations.added_members.length;
    const invitedCount = result.invitations.created_invitations.length;

    let message = `Grupa "${result.groupName}" została utworzona!`;
    if (addedCount > 0 || invitedCount > 0) {
      message += ` Dodano ${addedCount} członków i wysłano ${invitedCount} zaproszeń.`;
    }

    toast.success("Sukces!", {
      description: message,
      duration: 5000,
    });

    // Refresh groups list
    await groupsQuery.refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Pull to refresh indicator */}
      <PullToRefreshIndicator pullDistance={pullToRefresh.pullDistance} isRefreshing={pullToRefresh.isRefreshing} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Main content - Two independent sections */}
        <div className="space-y-8">
          {/* Invitations Section - show only if user has no groups or has invitations */}
          {(hasAnyGroups === false || invitationsQuery.data.length > 0 || invitationsQuery.loading) && (
            <InvitationsSection query={invitationsQuery} onChanged={handleInvitationChanged} />
          )}

          {/* Groups Section */}
          <GroupsSection query={groupsQuery} onAddExpense={handleAddExpense} />
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <FloatingActionButton onClick={handleCreateGroup} />
        {/* Add Expense FAB - only show if user has groups */}
        {hasAnyGroups && (
          <Button
            onClick={() => toast.info('Kliknij przycisk "Dodaj wydatek" na karcie grupy, aby dodać wydatek')}
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg shadow-blue-200 bg-blue-600 hover:bg-blue-700 transition-all duration-300 ease-out hover:scale-110 hover:shadow-xl hover:shadow-blue-300 focus-visible:scale-110 focus-visible:shadow-xl"
            aria-label="Dodaj wydatek"
            title="Kliknij przycisk na karcie grupy"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        )}
      </div>

      {/* Toast notifications */}
      <Toaster />

      {/* Create Group Modal */}
      <CreateGroupModal open={isCreateModalOpen} onOpenChange={handleModalOpenChange} onSuccess={handleCreateSuccess} />

      {/* Add Expense Modal */}
      {selectedExpenseGroupId && (
        <AddExpenseModal
          groupId={selectedExpenseGroupId}
          groupMembers={groupMembers}
          groupCurrencies={groupCurrencies}
          currentUserId={currentUserId}
          isOpen={!!selectedExpenseGroupId}
          onClose={handleExpenseModalClose}
          onExpenseCreated={handleExpenseSuccess}
          isLoading={isExpenseModalLoading}
        />
      )}
    </div>
  );
}
