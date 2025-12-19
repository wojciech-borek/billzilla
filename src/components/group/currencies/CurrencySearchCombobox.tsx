/**
 * Currency search select with filtering
 * Simplified version using native select
 */

import { Label } from "@/components/ui/label";
import type { CurrencyDTO } from "@/types";

interface CurrencySearchComboboxProps {
  availableCurrencies: CurrencyDTO[];
  selectedCurrency: string | null;
  onSelectCurrency: (currencyCode: string) => void;
  excludeCurrencies: string[];
}

// Popular currencies to show at the top
const POPULAR_CURRENCIES = ["USD", "EUR", "GBP", "CHF"];

export function CurrencySearchCombobox({
  availableCurrencies,
  selectedCurrency,
  onSelectCurrency,
  excludeCurrencies,
}: CurrencySearchComboboxProps) {
  // Filter out excluded currencies
  const filteredCurrencies = availableCurrencies.filter((currency) => !excludeCurrencies.includes(currency.code));

  // Separate popular and other currencies
  const popularCurrencies = filteredCurrencies.filter((c) => POPULAR_CURRENCIES.includes(c.code));
  const otherCurrencies = filteredCurrencies.filter((c) => !POPULAR_CURRENCIES.includes(c.code));

  return (
    <div className="space-y-2">
      <Label htmlFor="currency-select">Waluta</Label>
      <select
        id="currency-select"
        value={selectedCurrency || ""}
        onChange={(e) => onSelectCurrency(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Wybierz walutę...</option>

        {popularCurrencies.length > 0 && (
          <optgroup label="Popularne waluty">
            {popularCurrencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </optgroup>
        )}

        {otherCurrencies.length > 0 && (
          <optgroup label="Inne waluty">
            {otherCurrencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
