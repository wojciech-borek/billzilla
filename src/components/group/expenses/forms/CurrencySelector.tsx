import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GroupCurrencyDTO } from "@/types";

interface CurrencySelectorProps {
  currencies: GroupCurrencyDTO[];
  value: string;
  onChange: (currencyCode: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Select component for choosing expense currency from available group currencies
 */
export function CurrencySelector({ currencies, value, onChange, error, disabled = false }: CurrencySelectorProps) {
  if (currencies.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Waluta</Label>
        <div className="text-sm text-muted-foreground p-3 border rounded-lg bg-muted/50">
          Brak dostępnych walut w tej grupie
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="currency_code" className="text-sm font-medium">
        Waluta <span className="text-destructive">*</span>
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id="currency_code"
          className={error ? "border-destructive focus:ring-destructive" : ""}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "currency-error" : undefined}
        >
          <SelectValue placeholder="Wybierz walutę" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center justify-between w-full">
                <span>{currency.code}</span>
                {currency.exchange_rate !== 1 && (
                  <span className="text-xs text-muted-foreground ml-2">(kurs: {currency.exchange_rate})</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id="currency-error" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">Wybierz walutę, w której został poniesiony wydatek</p>
    </div>
  );
}
