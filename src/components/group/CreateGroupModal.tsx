import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import CreateGroupForm from "./CreateGroupForm";
import type { CreateGroupSuccessResult } from "../../lib/schemas/groupSchemas";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: CreateGroupSuccessResult) => void;
}

/**
 * Modal dialog for creating a new group
 * Wraps CreateGroupForm in a Dialog component
 * Can be used from dashboard, group detail view, or any other location
 */
export default function CreateGroupModal({ open, onOpenChange, onSuccess }: CreateGroupModalProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSuccess = (result: CreateGroupSuccessResult) => {
    onOpenChange(false);
    onSuccess?.(result);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Utwórz nową grupę</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Stwórz grupę rozliczeniową i zaproś znajomych do wspólnego dzielenia się wydatkami.
          </DialogDescription>
        </DialogHeader>

        <CreateGroupForm onCancel={handleCancel} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
