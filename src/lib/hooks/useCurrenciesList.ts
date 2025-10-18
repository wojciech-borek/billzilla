import { useState, useEffect } from 'react';
import { supabaseClient } from '../../db/supabase.client';
import type { CurrencyOption } from '../schemas/groupSchemas';

type UseCurrenciesListResult = {
  currencies: CurrencyOption[];
  loading: boolean;
  error: Error | null;
};

/**
 * Hook to fetch and sort currencies list
 * PLN is always listed first as the default currency
 */
export function useCurrenciesList(): UseCurrenciesListResult {
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCurrencies() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabaseClient
          .from('currencies')
          .select('code, name')
          .order('code', { ascending: true });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (!isMounted) return;

        // Transform to CurrencyOption format and sort PLN first
        const options: CurrencyOption[] = (data || []).map((currency) => ({
          code: currency.code,
          label: `${currency.code} — ${currency.name}`,
        }));

        // Sort: PLN first, then alphabetically by code
        const sortedOptions = options.sort((a, b) => {
          if (a.code === 'PLN') return -1;
          if (b.code === 'PLN') return 1;
          return a.code.localeCompare(b.code);
        });

        setCurrencies(sortedOptions);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error('Failed to fetch currencies'));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCurrencies();

    return () => {
      isMounted = false;
    };
  }, []);

  return { currencies, loading, error };
}

