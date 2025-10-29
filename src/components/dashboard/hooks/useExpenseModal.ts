import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { GroupMemberDTO, GroupCurrencyDTO, GroupMemberSummaryDTO } from "../../../types";

interface ExpenseModalState {
  selectedExpenseGroupId: string | null;
  groupMembers: GroupMemberSummaryDTO[];
  groupCurrencies: GroupCurrencyDTO[];
  isLoading: boolean;
}

interface ExpenseModalActions {
  openModal: (groupId: string) => Promise<void>;
  closeModal: () => void;
  handleExpenseSuccess: () => void;
}

export function useExpenseModal(onExpenseCreated?: () => Promise<void>) {
  const [state, setState] = useState<ExpenseModalState>({
    selectedExpenseGroupId: null,
    groupMembers: [],
    groupCurrencies: [],
    isLoading: false,
  });

  const openModal = useCallback(async (groupId: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Load group details
      const response = await fetch(`/api/groups/${groupId}`);
      if (!response.ok) {
        throw new Error("Nie udało się załadować danych grupy");
      }

      const groupData = await response.json();
      setState({
        selectedExpenseGroupId: groupId,
        groupMembers: (groupData.members || []).map((member: GroupMemberDTO) => ({
          profile_id: member.profile_id,
          full_name: member.full_name,
          avatar_url: member.avatar_url,
          status: member.status,
          role: member.role,
        })),
        groupCurrencies: groupData.group_currencies || [],
        isLoading: false,
      });
    } catch {
      toast.error("Nie udało się załadować danych grupy");
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const closeModal = useCallback(() => {
    setState({
      selectedExpenseGroupId: null,
      groupMembers: [],
      groupCurrencies: [],
      isLoading: false,
    });
  }, []);

  const handleExpenseSuccess = useCallback(async () => {
    if (onExpenseCreated) {
      await onExpenseCreated();
    }
    closeModal();
  }, [onExpenseCreated, closeModal]);

  const actions: ExpenseModalActions = {
    openModal,
    closeModal,
    handleExpenseSuccess,
  };

  return {
    ...state,
    ...actions,
  };
}
