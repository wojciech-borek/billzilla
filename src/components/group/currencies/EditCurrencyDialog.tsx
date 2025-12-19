/**
 * Dialog for editing currency exchange rate
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExchangeRateInput } from "./ExchangeRateInput";
import { useGroupCurrencies } from "./hooks/useGroupCurrencies";
import { toast } from "sonner";
import type { GroupCurrencyDTO } from "@/types";

interface EditCurrencyDialogProps {
  groupId: string;
  currency: GroupCurrencyDTO | null;
  baseCurrency: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EditCurrencyDialog({ groupId, currency, baseCurrency, isOpen, onClose }: EditCurrencyDialogProps) {
  const { updateRate } = useGroupCurrencies(groupId);
  const [exchangeRate, setExchangeRate] = useState(currency?.exchange_rate.toString() || "");
  const [error, setError] = useState<string | undefined>();

  const handleSave = async () => {
    if (!currency) return;

    const rate = parseFloat(exchangeRate);

    // Validation
    if (isNaN(rate) || rate <= 0) {
      setError("Kurs musi być większy od 0");
      return;
    }

    if (rate < 0.0001 || rate > 9999.9999) {
      setError("Kurs musi być w zakresie 0.0001 - 9999.9999");
      return;
    }

    const decimalPlaces = (exchangeRate.split(".")[1] || "").length;
    if (decimalPlaces > 4) {
      setError("Kurs może mieć maksymalnie 4 miejsca po przecinku");
      return;
    }

    try {
      await updateRate.mutateAsync({
        code: currency.code,
        exchange_rate: rate,
      });

      toast.success(`Kurs waluty ${currency.code} został pomyślnie zaktualizowany.`);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się zaktualizować kursu";
      toast.error(errorMessage);
    }
  };

  // Reset state when dialog opens with new currency
  const handleOpenChange = (open: boolean) => {
    if (open && currency) {
      setExchangeRate(currency.exchange_rate.toString());
      setError(undefined);
    }
    if (!open) {
      onClose();
    }
  };

  if (!currency) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edytuj kurs waluty</DialogTitle>
          <DialogDescription>
            Zaktualizuj kurs wymiany dla {currency.code} - {currency.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ExchangeRateInput
            value={exchangeRate}
            onChange={(value) => {
              setExchangeRate(value);
              setError(undefined);
            }}
            selectedCurrency={currency.code}
            baseCurrency={baseCurrency}
            error={error}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateRate.isPending}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={updateRate.isPending}>
            {updateRate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
