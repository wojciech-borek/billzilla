/**
 * Currency service - handles business logic for currency operations
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { GroupCurrencyDTO } from "../../types";
import { CurrencyRepository } from "./repositories/CurrencyRepository";

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

  const repository = new CurrencyRepository(supabase);
  const exists = await repository.verifyCurrencyExists(currencyCode);

  if (!exists) {
    throw new CurrencyOperationError("validate currency", `Currency with code '${currencyCode}' does not exist`);
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

  try {
    const repository = new CurrencyRepository(supabase);
    return await repository.fetchGroupCurrencies(groupId);
  } catch (error) {
    throw new CurrencyOperationError(
      "fetch group currencies",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Fetches all available currencies from the system
 *
 * @param supabase - Supabase client instance
 * @returns Array of all currencies with code and name
 * @throws {CurrencyOperationError} If data fetching fails
 */
export async function getAllCurrencies(supabase: SupabaseClient): Promise<{ code: string; name: string }[]> {
  try {
    const repository = new CurrencyRepository(supabase);
    return await repository.fetchAllCurrencies();
  } catch (error) {
    throw new CurrencyOperationError("fetch all currencies", error instanceof Error ? error.message : "Unknown error");
  }
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

  try {
    const repository = new CurrencyRepository(supabase);
    const rate = await repository.fetchExchangeRate(groupId, currencyCode);
    return rate || 1.0;
  } catch (error) {
    throw new CurrencyOperationError("get exchange rate", error instanceof Error ? error.message : "Unknown error");
  }
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

/**
 * Adds a new currency to a group with a specified exchange rate
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group
 * @param currencyCode - Currency code to add
 * @param exchangeRate - Exchange rate relative to base currency
 * @returns The added currency with details
 * @throws {CurrencyOperationError} If operation fails
 */
export async function addCurrencyToGroup(
  supabase: SupabaseClient,
  groupId: string,
  currencyCode: string,
  exchangeRate: number
): Promise<GroupCurrencyDTO> {
  // Input validation
  if (!groupId) {
    throw new CurrencyOperationError("add currency", "Group ID is required");
  }
  if (!currencyCode) {
    throw new CurrencyOperationError("add currency", "Currency code is required");
  }
  if (typeof exchangeRate !== "number" || exchangeRate <= 0) {
    throw new CurrencyOperationError("add currency", "Valid exchange rate is required");
  }

  const repository = new CurrencyRepository(supabase);

  // Validate currency exists in system
  const currencyExists = await repository.verifyCurrencyExists(currencyCode);
  if (!currencyExists) {
    throw new CurrencyOperationError("add currency", `Currency with code '${currencyCode}' does not exist`);
  }

  // Get group's base currency to prevent adding it
  const baseCurrency = await repository.fetchGroupBaseCurrency(groupId);
  if (!baseCurrency) {
    throw new CurrencyOperationError("add currency", "Group not found");
  }

  if (baseCurrency === currencyCode) {
    throw new CurrencyOperationError("add currency", "Cannot add base currency");
  }

  // Check if currency already exists in group
  const alreadyExists = await repository.checkCurrencyExistsInGroup(groupId, currencyCode);
  if (alreadyExists) {
    throw new CurrencyOperationError("add currency", "Currency already exists in group");
  }

  // Insert currency
  try {
    await repository.insertGroupCurrency(groupId, currencyCode, exchangeRate);
  } catch (error) {
    throw new CurrencyOperationError("add currency", error instanceof Error ? error.message : "Unknown error");
  }

  // Fetch and return the added currency with name
  const currencyData = await repository.fetchCurrencyByCode(currencyCode);
  if (!currencyData) {
    throw new CurrencyOperationError("add currency", "Failed to fetch currency details");
  }

  return {
    code: currencyData.code,
    name: currencyData.name,
    exchange_rate: exchangeRate,
  };
}

/**
 * Updates the exchange rate of a currency in a group
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group
 * @param currencyCode - Currency code to update
 * @param newExchangeRate - New exchange rate
 * @returns The updated currency with details
 * @throws {CurrencyOperationError} If operation fails
 */
export async function updateCurrencyRate(
  supabase: SupabaseClient,
  groupId: string,
  currencyCode: string,
  newExchangeRate: number
): Promise<GroupCurrencyDTO> {
  // Input validation
  if (!groupId) {
    throw new CurrencyOperationError("update currency rate", "Group ID is required");
  }
  if (!currencyCode) {
    throw new CurrencyOperationError("update currency rate", "Currency code is required");
  }
  if (typeof newExchangeRate !== "number" || newExchangeRate <= 0) {
    throw new CurrencyOperationError("update currency rate", "Valid exchange rate is required");
  }

  const repository = new CurrencyRepository(supabase);

  // Get group's base currency to prevent editing it
  const baseCurrency = await repository.fetchGroupBaseCurrency(groupId);
  if (!baseCurrency) {
    throw new CurrencyOperationError("update currency rate", "Group not found");
  }

  if (baseCurrency === currencyCode) {
    throw new CurrencyOperationError("update currency rate", "Cannot update base currency");
  }

  // Update exchange rate
  try {
    await repository.updateGroupCurrencyRate(groupId, currencyCode, newExchangeRate);
  } catch (error) {
    throw new CurrencyOperationError("update currency rate", error instanceof Error ? error.message : "Unknown error");
  }

  // Fetch and return the updated currency with name
  const currencyData = await repository.fetchCurrencyByCode(currencyCode);
  if (!currencyData) {
    throw new CurrencyOperationError("update currency rate", "Failed to fetch currency details");
  }

  return {
    code: currencyData.code,
    name: currencyData.name,
    exchange_rate: newExchangeRate,
  };
}

/**
 * Checks if a currency is used in any expenses in a group
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group
 * @param currencyCode - Currency code to check
 * @returns true if currency is used, false otherwise
 * @throws {CurrencyOperationError} If check fails
 */
export async function checkCurrencyUsageInExpenses(
  supabase: SupabaseClient,
  groupId: string,
  currencyCode: string
): Promise<boolean> {
  // Input validation
  if (!groupId) {
    throw new CurrencyOperationError("check currency usage", "Group ID is required");
  }
  if (!currencyCode) {
    throw new CurrencyOperationError("check currency usage", "Currency code is required");
  }

  try {
    const repository = new CurrencyRepository(supabase);
    return await repository.checkCurrencyUsageInExpenses(groupId, currencyCode);
  } catch (error) {
    throw new CurrencyOperationError("check currency usage", error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Removes a currency from a group
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group
 * @param currencyCode - Currency code to remove
 * @throws {CurrencyOperationError} If operation fails
 */
export async function removeCurrencyFromGroup(
  supabase: SupabaseClient,
  groupId: string,
  currencyCode: string
): Promise<void> {
  // Input validation
  if (!groupId) {
    throw new CurrencyOperationError("remove currency", "Group ID is required");
  }
  if (!currencyCode) {
    throw new CurrencyOperationError("remove currency", "Currency code is required");
  }

  const repository = new CurrencyRepository(supabase);

  // Get group's base currency to prevent deleting it
  const baseCurrency = await repository.fetchGroupBaseCurrency(groupId);
  if (!baseCurrency) {
    throw new CurrencyOperationError("remove currency", "Group not found");
  }

  if (baseCurrency === currencyCode) {
    throw new CurrencyOperationError("remove currency", "Cannot remove base currency");
  }

  // Check if currency is used in expenses
  const isUsed = await repository.checkCurrencyUsageInExpenses(groupId, currencyCode);
  if (isUsed) {
    throw new CurrencyOperationError("remove currency", "Currency is used in existing expenses");
  }

  // Delete currency from group
  try {
    await repository.deleteGroupCurrency(groupId, currencyCode);
  } catch (error) {
    throw new CurrencyOperationError("remove currency", error instanceof Error ? error.message : "Unknown error");
  }
}
