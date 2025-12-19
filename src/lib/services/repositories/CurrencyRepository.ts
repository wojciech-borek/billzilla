import type { SupabaseClient } from "../../../db/supabase.client";
import type { GroupCurrencyDTO } from "../../../types";

/**
 * Repository pattern for currency-related database operations
 * Encapsulates all data access logic for currencies
 */
export class CurrencyRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Verify that a currency code exists in the system
   */
  async verifyCurrencyExists(currencyCode: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("currencies").select("code").eq("code", currencyCode).single();

    return !error && data !== null;
  }

  /**
   * Fetch currency details by code
   */
  async fetchCurrencyByCode(currencyCode: string): Promise<{ code: string; name: string } | null> {
    const { data, error } = await this.supabase
      .from("currencies")
      .select("code, name")
      .eq("code", currencyCode)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Fetch base currency code for a group
   */
  async fetchGroupBaseCurrency(groupId: string): Promise<string | null> {
    const { data, error } = await this.supabase.from("groups").select("base_currency_code").eq("id", groupId).single();

    if (error || !data) {
      return null;
    }

    return data.base_currency_code;
  }

  /**
   * Check if a currency already exists in a group
   */
  async checkCurrencyExistsInGroup(groupId: string, currencyCode: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("group_currencies")
      .select("currency_code")
      .eq("group_id", groupId)
      .eq("currency_code", currencyCode)
      .single();

    return !error && data !== null;
  }

  /**
   * Insert a new currency into a group
   */
  async insertGroupCurrency(groupId: string, currencyCode: string, exchangeRate: number): Promise<void> {
    const { error } = await this.supabase.from("group_currencies").insert({
      group_id: groupId,
      currency_code: currencyCode,
      exchange_rate: exchangeRate,
    });

    if (error) {
      throw new Error(`Failed to insert currency: ${error.message}`);
    }
  }

  /**
   * Update exchange rate for a currency in a group
   */
  async updateGroupCurrencyRate(groupId: string, currencyCode: string, exchangeRate: number): Promise<void> {
    const { error } = await this.supabase
      .from("group_currencies")
      .update({ exchange_rate: exchangeRate })
      .eq("group_id", groupId)
      .eq("currency_code", currencyCode);

    if (error) {
      throw new Error(`Failed to update currency rate: ${error.message}`);
    }
  }

  /**
   * Delete a currency from a group
   */
  async deleteGroupCurrency(groupId: string, currencyCode: string): Promise<void> {
    const { error } = await this.supabase
      .from("group_currencies")
      .delete()
      .eq("group_id", groupId)
      .eq("currency_code", currencyCode);

    if (error) {
      throw new Error(`Failed to delete currency: ${error.message}`);
    }
  }

  /**
   * Check if a currency is used in any expenses in a group
   */
  async checkCurrencyUsageInExpenses(groupId: string, currencyCode: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("expenses")
      .select("id")
      .eq("group_id", groupId)
      .eq("currency_code", currencyCode)
      .limit(1);

    if (error) {
      throw new Error(`Failed to check currency usage: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }

  /**
   * Fetch exchange rate for a specific currency in a group
   */
  async fetchExchangeRate(groupId: string, currencyCode: string): Promise<number | null> {
    const { data, error } = await this.supabase
      .from("group_currencies")
      .select("exchange_rate")
      .eq("group_id", groupId)
      .eq("currency_code", currencyCode)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw new Error(`Failed to fetch exchange rate: ${error.message}`);
    }

    return data?.exchange_rate || null;
  }

  /**
   * Fetch all currencies for a group
   */
  async fetchGroupCurrencies(groupId: string): Promise<GroupCurrencyDTO[]> {
    const { data, error } = await this.supabase
      .from("group_currencies")
      .select(
        `
        currency_code,
        exchange_rate,
        currencies (
          name
        )
      `
      )
      .eq("group_id", groupId)
      .order("currency_code");

    if (error) {
      throw new Error(`Failed to fetch group currencies: ${error.message}`);
    }

    if (!data) return [];

    return data.map((gc) => {
      const currencyInfo = gc.currencies as { name: string } | null;
      return {
        code: gc.currency_code,
        name: currencyInfo?.name || "Unknown",
        exchange_rate: gc.exchange_rate,
      };
    });
  }

  /**
   * Fetch all available currencies from the system
   */
  async fetchAllCurrencies(): Promise<{ code: string; name: string }[]> {
    const { data, error } = await this.supabase.from("currencies").select("code, name").order("code");

    if (error) {
      throw new Error(`Failed to fetch currencies: ${error.message}`);
    }

    return data || [];
  }
}
