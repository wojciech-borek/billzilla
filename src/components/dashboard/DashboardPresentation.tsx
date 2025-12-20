import InvitationsSection from "./InvitationsSection";
import GroupsSection from "./GroupsSection";
import FloatingActionButton from "./FloatingActionButton";
import PullToRefreshIndicator from "./PullToRefreshIndicator";
import CreateGroupModal from "../group/CreateGroupModal";
import { AddExpenseModal } from "../group/expenses/AddExpenseModal";
import { Toaster } from "../ui/sonner";
import type { DashboardPresentationProps } from "./DashboardContainer";

export function DashboardPresentation(props: DashboardPresentationProps) {
  const {
    groupsQuery,
    invitationsQuery,
    pullToRefresh,
    expenseModal,
    createGroupModal,
    hasAnyGroups,
    currentUserId,
    onInvitationChanged,
    onCreateGroup,
    onAddExpense,
  } = props;

  return (
    <div className="min-h-screen bg-background">
      {/* Pull to refresh indicator */}
      <PullToRefreshIndicator pullDistance={pullToRefresh.pullDistance} isRefreshing={pullToRefresh.isRefreshing} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Main content - Two independent sections */}
        <div className="space-y-8">
          {/* Invitations Section - show only if user has no groups or has invitations */}
          {(hasAnyGroups === false || invitationsQuery.data.length > 0 || invitationsQuery.loading) && (
            <InvitationsSection query={invitationsQuery} onChanged={onInvitationChanged} />
          )}

          {/* Groups Section */}
          <GroupsSection query={groupsQuery} onAddExpense={onAddExpense} />
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={onCreateGroup} />

      {/* Toast notifications */}
      <Toaster />

      {/* Create Group Modal */}
      <CreateGroupModal
        open={createGroupModal.isOpen}
        onOpenChange={createGroupModal.closeModal}
        onSuccess={createGroupModal.handleCreateSuccess}
      />

      {/* Add Expense Modal */}
      {expenseModal.selectedExpenseGroupId && (
        <AddExpenseModal
          groupId={expenseModal.selectedExpenseGroupId}
          groupMembers={expenseModal.groupMembers}
          groupCurrencies={expenseModal.groupCurrencies}
          currentUserId={currentUserId}
          isOpen={!!expenseModal.selectedExpenseGroupId}
          onClose={expenseModal.closeModal}
          onExpenseCreated={expenseModal.handleExpenseSuccess}
          isLoading={expenseModal.isLoading}
        />
      )}
    </div>
  );
}
