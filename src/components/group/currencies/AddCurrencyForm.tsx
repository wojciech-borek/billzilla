/**
 * Form for adding a new currency to a group
 * Simplified version using controlled components
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CurrencySearchCombobox } from "./CurrencySearchCombobox";
import { ExchangeRateInput } from "./ExchangeRateInput";
import { useGroupCurrencies } from "./hooks/useGroupCurrencies";
import { useAllCurrencies } from "./hooks/useAllCurrencies";
import { addCurrencySchema } from "@/lib/schemas/currencySchemas";
import { toast } from "sonner";

interface AddCurrencyFormProps {
  groupId: string;
  baseCurrency: string;
  existingCurrencies: string[];
  onSuccess: () => void;
}

export function AddCurrencyForm({ groupId, baseCurrency, existingCurrencies, onSuccess }: AddCurrencyFormProps) {
  const { addCurrency } = useGroupCurrencies(groupId);
  const { data: allCurrencies, isLoading: isLoadingCurrencies } = useAllCurrencies();

  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<string>("");
  const [error, setError] = useState<string | undefined>();

  // Exclude base currency and already added currencies
  const excludedCurrencies = [baseCurrency, ...existingCurrencies];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    // Validation with Zod
    const validation = addCurrencySchema.safeParse({
      currency_code: selectedCurrency,
      exchange_rate: parseFloat(exchangeRate),
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Niepoprawne dane";
      setError(firstError);
      return;
    }

    const { currency_code, exchange_rate } = validation.data;

    try {
      await addCurrency.mutateAsync({
        currency_code,
        exchange_rate,
      });

      toast.success(`Waluta ${selectedCurrency} została pomyślnie dodana do grupy.`);

      // Reset form
      setSelectedCurrency("");
      setExchangeRate("");
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się dodać waluty";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  if (isLoadingCurrencies) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <CurrencySearchCombobox
        availableCurrencies={allCurrencies || []}
        selectedCurrency={selectedCurrency || null}
        onSelectCurrency={setSelectedCurrency}
        excludeCurrencies={excludedCurrencies}
      />

      <ExchangeRateInput
        value={exchangeRate}
        onChange={setExchangeRate}
        selectedCurrency={selectedCurrency || null}
        baseCurrency={baseCurrency}
      />

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={addCurrency.isPending || !selectedCurrency || !exchangeRate}>
          {addCurrency.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Dodaj walutę
        </Button>
      </div>
    </form>
  );
}
