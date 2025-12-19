/**
 * Input component for exchange rate with validation and helper text
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ExchangeRateInputProps {
  value: string;
  onChange: (value: string) => void;
  selectedCurrency: string | null;
  baseCurrency: string;
  error?: string;
}

export function ExchangeRateInput({ value, onChange, selectedCurrency, baseCurrency, error }: ExchangeRateInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="exchange_rate">
        Kurs wymiany {selectedCurrency ? `(1 ${selectedCurrency} = ? ${baseCurrency})` : ""}
      </Label>
      <Input
        id="exchange_rate"
        type="number"
        step="0.0001"
        min="0.0001"
        max="9999.9999"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="np. 4.5000"
        className={error ? "border-red-500" : ""}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!error && selectedCurrency && (
        <p className="text-xs text-muted-foreground">
          Przykład: Jeśli 1 {selectedCurrency} = 4.50 {baseCurrency}, wpisz 4.5000
        </p>
      )}
    </div>
  );
}
