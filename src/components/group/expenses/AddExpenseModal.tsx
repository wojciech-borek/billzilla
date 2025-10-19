import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

import { ExpenseForm } from "./forms/ExpenseForm";
import type { GroupMemberSummaryDTO, GroupCurrencyDTO, ExpenseDTO } from "@/types";

interface AddExpenseModalProps {
  groupId: string;
  groupMembers: GroupMemberSummaryDTO[];
  groupCurrencies: GroupCurrencyDTO[];
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onExpenseCreated?: (expense: ExpenseDTO) => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Modal wrapper for expense creation form
 */
export function AddExpenseModal({
  groupId,
  groupMembers,
  groupCurrencies,
  currentUserId,
  isOpen,
  onClose,
  onExpenseCreated,
  isLoading = false,
  error = null,
}: AddExpenseModalProps) {
  const handleExpenseCreated = async (expense: ExpenseDTO) => {
    toast.success("Wydatek został utworzony pomyślnie!");
    onExpenseCreated?.(expense);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl h-[90vh] p-0 rounded-lg overflow-hidden flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader className="px-6 py-4 border-b bg-background flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Dodaj wydatek</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2 h-auto" aria-label="Zamknij modal">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 px-6 py-4 overflow-y-auto bg-background min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Ładowanie danych grupy...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button onClick={onClose} variant="ghost">
                Zamknij
              </Button>
            </div>
          ) : (
            <ExpenseForm
              groupId={groupId}
              groupMembers={groupMembers}
              groupCurrencies={groupCurrencies}
              currentUserId={currentUserId}
              onSubmit={handleExpenseCreated}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
