import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { CreateGroupSuccessResult } from "../../../lib/schemas/groupSchemas";

interface CreateGroupModalActions {
  openModal: () => void;
  closeModal: () => void;
  handleCreateSuccess: (result: CreateGroupSuccessResult) => Promise<void>;
}

export function useCreateGroupModal(onGroupCreated?: () => Promise<void>) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleCreateSuccess = useCallback(
    async (result: CreateGroupSuccessResult) => {
      // Show success toast
      const addedCount = result.invitations.added_members.length;
      const invitedCount = result.invitations.created_invitations.length;

      let message = `Grupa "${result.groupName}" została utworzona!`;
      if (addedCount > 0 || invitedCount > 0) {
        message += ` Dodano ${addedCount} uczestników i wysłano ${invitedCount} zaproszeń.`;
      }

      toast.success("Sukces!", {
        description: message,
        duration: 5000,
      });

      // Call optional callback and close modal
      if (onGroupCreated) {
        await onGroupCreated();
      }
      closeModal();
    },
    [onGroupCreated, closeModal]
  );

  const actions: CreateGroupModalActions = {
    openModal,
    closeModal,
    handleCreateSuccess,
  };

  return {
    isOpen,
    ...actions,
  };
}
