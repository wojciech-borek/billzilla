import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { CreateGroupFormValues, CurrencyOption } from '../../lib/schemas/groupSchemas';
import { useCurrenciesList } from '../../lib/hooks/useCurrenciesList';

type BaseCurrencySelectProps = {
  control: Control<CreateGroupFormValues>;
  errors: FieldErrors<CreateGroupFormValues>;
};

/**
 * Currency select component for group creation form
 * Loads currencies from database, PLN is listed first and set as default
 */
export default function BaseCurrencySelect({ control, errors }: BaseCurrencySelectProps) {
  const { currencies, loading, error } = useCurrenciesList();

  if (error) {
    return (
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Waluta bazowa</Label>
        <p className="text-sm text-destructive">
          Nie udało się załadować listy walut. Spróbuj odświeżyć stronę.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="base_currency_code" className="text-foreground font-medium">
        Waluta bazowa <span className="text-destructive">*</span>
      </Label>
      <Controller
        name="base_currency_code"
        control={control}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={field.onChange}
            disabled={loading}
          >
            <SelectTrigger
              id="base_currency_code"
              className={errors.base_currency_code ? 'border-destructive focus:ring-destructive' : ''}
              aria-invalid={errors.base_currency_code ? 'true' : 'false'}
              aria-describedby={errors.base_currency_code ? 'currency-error' : undefined}
            >
              <SelectValue placeholder={loading ? 'Ładowanie...' : 'Wybierz walutę'} />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency: CurrencyOption) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors.base_currency_code && (
        <p id="currency-error" className="text-sm text-destructive" role="alert">
          {errors.base_currency_code.message}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Waluta, w której będą rozliczane wszystkie wydatki w grupie
      </p>
    </div>
  );
}

