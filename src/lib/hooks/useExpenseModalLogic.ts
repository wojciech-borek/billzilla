import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { TranscriptionResultDTO, CreateExpenseCommand, GroupCurrencyDTO } from "@/types";

export function useExpenseModalLogic(currentUserId: string) {
  const [isFromVoice, setIsFromVoice] = useState(false);
  const [transcriptionData, setTranscriptionData] = useState<CreateExpenseCommand | null>(null);
  const [lowConfidence, setLowConfidence] = useState(false);

  const processTranscription = useCallback(
    (result: TranscriptionResultDTO, groupCurrencies: GroupCurrencyDTO[]) => {
      try {
        // Validate confidence level
        const hasLowConfidence = result.confidence < 0.5;
        setLowConfidence(hasLowConfidence);

        if (hasLowConfidence) {
          toast.warning("Wyniki rozpoznania mogą być niedokładne. Sprawdź wszystkie pola przed zatwierdzeniem.", {
            duration: 5000,
          });
        }

        // AI now returns splits with profile_ids directly - no mapping needed!
        const expenseData = result.expense_data as CreateExpenseCommand;

        // Apply defaults for optional fields (payer, date, currency)
        // These will be further validated and defaulted in populateFromTranscription
        const finalExpenseData: CreateExpenseCommand = {
          description: expenseData.description,
          amount: expenseData.amount,
          currency_code: expenseData.currency_code || groupCurrencies[0]?.code || "PLN",
          expense_date: expenseData.expense_date || new Date().toISOString().slice(0, 16),
          payer_id: expenseData.payer_id || currentUserId, // null if AI didn't determine, will use current user
          splits: expenseData.splits,
        };

        // Set transcription data and mark as from voice
        setTranscriptionData(finalExpenseData);
        setIsFromVoice(true);

        toast.success("Wydatek rozpoznany! Sprawdź dane i zatwierdź.");
      } catch (error) {
        toast.error("Błąd podczas przetwarzania rozpoznanego wydatku");
      }
    },
    [currentUserId]
  );

  const handleTranscriptionError = useCallback((error: { message: string }) => {
    toast.error(`Błąd rozpoznania głosu: ${error.message}`, {
      duration: 5000,
    });
  }, []);

  const resetVoiceState = useCallback(() => {
    setIsFromVoice(false);
    setTranscriptionData(null);
    setLowConfidence(false);
  }, []);

  return {
    isFromVoice,
    transcriptionData,
    lowConfidence,
    processTranscription,
    handleTranscriptionError,
    resetVoiceState,
  };
}
