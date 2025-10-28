import InvitationsSection from "./InvitationsSection";
import GroupsSection from "./GroupsSection";
import FloatingActionButton from "./FloatingActionButton";
import PullToRefreshIndicator from "./PullToRefreshIndicator";
import CreateGroupModal from "../group/CreateGroupModal";
import { AddExpenseModal } from "../group/expenses/AddExpenseModal";
import { Toaster } from "../ui/sonner";
import { Button } from "../ui/button";
import { toast } from "sonner";
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <FloatingActionButton onClick={onCreateGroup} />
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
