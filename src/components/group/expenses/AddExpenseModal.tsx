import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

import { ExpenseForm } from "./forms/ExpenseForm";
import type { GroupMemberSummaryDTO, GroupCurrencyDTO, ExpenseDTO, TranscriptionResultDTO, TranscriptionErrorDTO, CreateExpenseCommand } from "@/types";

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
  const [isFromVoice, setIsFromVoice] = useState(false);
  const [transcriptionData, setTranscriptionData] = useState<CreateExpenseCommand | null>(null);
  const [lowConfidence, setLowConfidence] = useState(false);

  const handleExpenseCreated = async (expense: ExpenseDTO) => {
    toast.success("Wydatek został utworzony pomyślnie!");
    onExpenseCreated?.(expense);
    onClose();
  };

  const handleTranscriptionComplete = (result: TranscriptionResultDTO) => {
    try {
      // Validate confidence level
      const hasLowConfidence = result.confidence < 0.5;
      setLowConfidence(hasLowConfidence);

      if (hasLowConfidence) {
        toast.warning("Wyniki rozpoznania mogą być niedokładne. Sprawdź wszystkie pola przed zatwierdzeniem.", {
          duration: 5000,
        });
      }

      // Set transcription data and mark as from voice
      setTranscriptionData(result.expense_data);
      setIsFromVoice(true);

      toast.success("Wydatek rozpoznany! Sprawdź dane i zatwierdź.");
    } catch (error) {
      console.error("Error handling transcription result:", error);
      toast.error("Błąd podczas przetwarzania rozpoznanego wydatku");
    }
  };

  const handleTranscriptionError = (error: TranscriptionErrorDTO) => {
    toast.error(`Błąd rozpoznania głosu: ${error.message}`, {
      duration: 5000,
    });
  };

  // Reset voice state when modal closes
  const handleClose = () => {
    setIsFromVoice(false);
    setTranscriptionData(null);
    setLowConfidence(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl p-0 rounded-lg"
        showCloseButton={false}
      >
        <DialogHeader className="px-6 py-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Dodaj wydatek</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="p-2 h-auto" aria-label="Zamknij modal">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 bg-background max-h-[70vh] overflow-y-auto">
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
              initialData={transcriptionData || undefined}
              isFromVoice={isFromVoice}
              hasLowConfidence={lowConfidence}
              onTranscriptionComplete={handleTranscriptionComplete}
              onTranscriptionError={handleTranscriptionError}
              isLoading={isLoading || !!error}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
