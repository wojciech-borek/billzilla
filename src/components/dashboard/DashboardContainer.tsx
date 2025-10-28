import { useCallback } from "react";
import { useGroupsList } from "./hooks/useGroupsList";
import { useInvitationsList } from "./hooks/useInvitationsList";
import { usePullToRefresh } from "./hooks/usePullToRefresh";
import { useExpenseModal } from "./hooks/useExpenseModal";
import { useCreateGroupModal } from "./hooks/useCreateGroupModal";

interface DashboardContainerProps {
  groupsLimit?: number;
  currentUserId: string;
}

export interface DashboardPresentationProps {
  groupsQuery: ReturnType<typeof useGroupsList>;
  invitationsQuery: ReturnType<typeof useInvitationsList>;
  pullToRefresh: ReturnType<typeof usePullToRefresh>;
  expenseModal: ReturnType<typeof useExpenseModal>;
  createGroupModal: ReturnType<typeof useCreateGroupModal>;
  hasAnyGroups: boolean;
  currentUserId: string;
  onInvitationChanged: () => Promise<void>;
  onCreateGroup: () => void;
  onAddExpense: (groupId: string) => Promise<void>;
}

export function DashboardContainer({ groupsLimit = 20, currentUserId }: DashboardContainerProps) {
  const groupsQuery = useGroupsList({
    status: "active",
    limit: groupsLimit,
  });

  const invitationsQuery = useInvitationsList();

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([groupsQuery.refetch(), invitationsQuery.refetch()]);
  }, [groupsQuery, invitationsQuery]);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: true,
  });

  // Expense modal hook with success callback that refetches groups
  const expenseModal = useExpenseModal(async () => {
    await groupsQuery.refetch();
  });

  // Create group modal hook with success callback that refetches groups
  const createGroupModal = useCreateGroupModal(async () => {
    await groupsQuery.refetch();
  });

  // Computed values
  const hasAnyGroups = groupsQuery.data.length > 0;

  // Event handlers
  const handleInvitationChanged = async () => {
    // Refetch both sections when invitation is accepted
    await Promise.all([groupsQuery.refetch(), invitationsQuery.refetch()]);
  };

  const handleCreateGroup = () => {
    createGroupModal.openModal();
  };

  const handleAddExpense = async (groupId: string) => {
    await expenseModal.openModal(groupId);
  };

  const presentationProps: DashboardPresentationProps = {
    groupsQuery,
    invitationsQuery,
    pullToRefresh,
    expenseModal,
    createGroupModal,
    hasAnyGroups,
    currentUserId,
    onInvitationChanged: handleInvitationChanged,
    onCreateGroup: handleCreateGroup,
    onAddExpense: handleAddExpense,
  };

  return presentationProps;
}
