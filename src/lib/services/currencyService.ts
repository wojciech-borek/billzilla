/**
 * Currency service - handles business logic for currency operations
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { GroupCurrencyDTO } from "../../types";

/**
 * Custom error for currency-related operations
 */
export class CurrencyOperationError extends Error {
  constructor(operation: string, details?: string) {
    super(`Currency operation failed during ${operation}${details ? `: ${details}` : ""}`);
    this.name = "CurrencyOperationError";
  }
}

/**
 * Validates that a currency code exists in the system
 *
 * @param supabase - Supabase client instance
 * @param currencyCode - Currency code to validate
 * @returns true if currency exists, false otherwise
 * @throws {CurrencyOperationError} If validation fails
 */
export async function validateCurrencyExists(supabase: SupabaseClient, currencyCode: string): Promise<boolean> {
  // Input validation
  if (!currencyCode) {
    throw new CurrencyOperationError("validate currency", "Currency code is required");
  }

  const { error: currencyError } = await supabase.from("currencies").select("code").eq("code", currencyCode).single();

  if (currencyError) {
    if (currencyError.code === "PGRST116") {
      // PGRST116 = no rows returned - currency doesn't exist
      throw new CurrencyOperationError("validate currency", `Currency with code '${currencyCode}' does not exist`);
    } else {
      // Other database errors
      throw new CurrencyOperationError("validate currency", currencyError.message);
    }
  }

  return true;
}

/**
 * Fetches all currencies available in a specific group
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group to fetch currencies for
 * @returns Array of group currencies with exchange rates
 * @throws {CurrencyOperationError} If data fetching fails
 */
export async function fetchGroupCurrencies(supabase: SupabaseClient, groupId: string): Promise<GroupCurrencyDTO[]> {
  // Input validation
  if (!groupId) {
    throw new CurrencyOperationError("fetch group currencies", "Group ID is required");
  }

  const { data: currenciesData, error: currenciesError } = await supabase
    .from("group_currencies")
    .select("currency_code, exchange_rate, currencies(name)")
    .eq("group_id", groupId)
    .order("currency_code");

  if (currenciesError) {
    throw new CurrencyOperationError("fetch group currencies", currenciesError.message);
  }

  // Transform currencies data
  const groupCurrencies: GroupCurrencyDTO[] = (currenciesData || []).map((gc) => {
    const currency = gc.currencies as unknown as { name: string };
    return {
      code: gc.currency_code,
      name: currency.name,
      exchange_rate: gc.exchange_rate,
    };
  });

  return groupCurrencies;
}

/**
 * Gets exchange rate for a specific currency in a group
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group
 * @param currencyCode - Currency code to get exchange rate for
 * @returns Exchange rate (default 1.0 if currency not found)
 * @throws {CurrencyOperationError} If data fetching fails
 */
export async function getExchangeRate(
  supabase: SupabaseClient,
  groupId: string,
  currencyCode: string
): Promise<number> {
  // Input validation
  if (!groupId) {
    throw new CurrencyOperationError("get exchange rate", "Group ID is required");
  }
  if (!currencyCode) {
    throw new CurrencyOperationError("get exchange rate", "Currency code is required");
  }

  const { data: currencyData, error: currencyError } = await supabase
    .from("group_currencies")
    .select("exchange_rate")
    .eq("group_id", groupId)
    .eq("currency_code", currencyCode)
    .single();

  if (currencyError && currencyError.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw new CurrencyOperationError("get exchange rate", currencyError.message);
  }

  return currencyData?.exchange_rate || 1.0;
}

/**
 * Converts an amount from one currency to another using group exchange rates
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group containing exchange rates
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code (defaults to group's base currency)
 * @returns Converted amount
 * @throws {CurrencyOperationError} If conversion fails
 */
export async function convertCurrency(
  supabase: SupabaseClient,
  groupId: string,
  amount: number,
  fromCurrency: string,
  toCurrency?: string
): Promise<number> {
  // Input validation
  if (!groupId) {
    throw new CurrencyOperationError("convert currency", "Group ID is required");
  }
  if (typeof amount !== "number" || isNaN(amount)) {
    throw new CurrencyOperationError("convert currency", "Valid amount is required");
  }
  if (!fromCurrency) {
    throw new CurrencyOperationError("convert currency", "Source currency code is required");
  }

  try {
    // If converting to same currency, return original amount
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Get exchange rates
    const fromRate = await getExchangeRate(supabase, groupId, fromCurrency);
    const toRate = toCurrency ? await getExchangeRate(supabase, groupId, toCurrency) : 1.0; // Base currency has rate 1.0

    // Convert through base currency: amount * fromRate / toRate
    return (amount * fromRate) / toRate;
  } catch (error) {
    throw new CurrencyOperationError("convert currency", error instanceof Error ? error.message : "Unknown error");
  }
}
