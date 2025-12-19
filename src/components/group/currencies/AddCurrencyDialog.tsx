/**
 * Dialog for adding a new currency to a group
 * Simple modal wrapper - form logic is in AddCurrencyForm component
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddCurrencyForm } from "./AddCurrencyForm";

interface AddCurrencyDialogProps {
  groupId: string;
  baseCurrencyCode: string;
  existingCurrencies: string[];
  isOpen: boolean;
  onClose: () => void;
  isCreator: boolean;
}

export function AddCurrencyDialog({
  groupId,
  baseCurrencyCode,
  existingCurrencies,
  isOpen,
  onClose,
  isCreator,
}: AddCurrencyDialogProps) {
  // Only creators can add currencies
  if (!isCreator) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj walutę</DialogTitle>
          <DialogDescription>Wybierz walutę i ustaw kurs wymiany względem {baseCurrencyCode}</DialogDescription>
        </DialogHeader>

        <AddCurrencyForm
          groupId={groupId}
          baseCurrency={baseCurrencyCode}
          existingCurrencies={existingCurrencies}
          onSuccess={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
