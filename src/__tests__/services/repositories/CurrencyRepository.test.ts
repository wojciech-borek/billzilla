import { describe, it, expect, beforeEach } from "vitest";
import { CurrencyRepository } from "@/lib/services/repositories/CurrencyRepository";
import { createMockSupabaseClient, resetMockSupabaseClient, type MockSupabaseClient } from "../testHelpers";

let mockSupabaseClient: MockSupabaseClient;
let repository: CurrencyRepository;

beforeEach(() => {
  mockSupabaseClient = createMockSupabaseClient();
  resetMockSupabaseClient(mockSupabaseClient);
  repository = new CurrencyRepository(mockSupabaseClient as any);
});

describe("CurrencyRepository", () => {
  describe("verifyCurrencyExists", () => {
    it("should_return_true_when_currency_exists", async () => {
      // Arrange
      const currencyCode = "USD";
      mockSupabaseClient.single.mockResolvedValue({
        data: { code: "USD" },
        error: null,
      });

      // Act
      const result = await repository.verifyCurrencyExists(currencyCode);

      // Assert
      expect(result).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("currencies");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("code");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("code", currencyCode);
      expect(mockSupabaseClient.single).toHaveBeenCalled();
    });

    it("should_return_false_when_currency_not_found", async () => {
      // Arrange
      const currencyCode = "INVALID";
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: "Currency not found" },
      });

      // Act
      const result = await repository.verifyCurrencyExists(currencyCode);

      // Assert
      expect(result).toBe(false);
    });

    it("should_call_supabase_with_correct_query", async () => {
      // Arrange
      const currencyCode = "EUR";
      mockSupabaseClient.single.mockResolvedValue({
        data: { code: "EUR" },
        error: null,
      });

      // Act
      await repository.verifyCurrencyExists(currencyCode);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("currencies");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("code");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("code", currencyCode);
      expect(mockSupabaseClient.single).toHaveBeenCalled();
    });
  });

  describe("fetchCurrencyByCode", () => {
    it("should_return_currency_data_when_found", async () => {
      // Arrange
      const currencyCode = "EUR";
      const mockCurrency = { code: "EUR", name: "Euro" };
      mockSupabaseClient.single.mockResolvedValue({
        data: mockCurrency,
        error: null,
      });

      // Act
      const result = await repository.fetchCurrencyByCode(currencyCode);

      // Assert
      expect(result).toEqual(mockCurrency);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("currencies");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("code, name");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("code", currencyCode);
    });

    it("should_return_null_when_currency_not_found", async () => {
      // Arrange
      const currencyCode = "INVALID";
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      // Act
      const result = await repository.fetchCurrencyByCode(currencyCode);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("fetchGroupBaseCurrency", () => {
    it("should_return_base_currency_code_when_group_exists", async () => {
      // Arrange
      const groupId = "group-123";
      mockSupabaseClient.single.mockResolvedValue({
        data: { base_currency_code: "PLN" },
        error: null,
      });

      // Act
      const result = await repository.fetchGroupBaseCurrency(groupId);

      // Assert
      expect(result).toBe("PLN");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("groups");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("base_currency_code");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("id", groupId);
    });

    it("should_return_null_when_group_not_found", async () => {
      // Arrange
      const groupId = "invalid-group";
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: "Group not found" },
      });

      // Act
      const result = await repository.fetchGroupBaseCurrency(groupId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("checkCurrencyExistsInGroup", () => {
    it("should_return_true_when_currency_exists_in_group", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      mockSupabaseClient.single.mockResolvedValue({
        data: { currency_code: "EUR" },
        error: null,
      });

      // Act
      const result = await repository.checkCurrencyExistsInGroup(groupId, currencyCode);

      // Assert
      expect(result).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_currencies");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("currency_code");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("group_id", groupId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("currency_code", currencyCode);
    });

    it("should_return_false_when_currency_not_in_group", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      // Act
      const result = await repository.checkCurrencyExistsInGroup(groupId, currencyCode);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("insertGroupCurrency", () => {
    it("should_insert_currency_successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const exchangeRate = 4.5;
      // Mock the insert chain: from().insert() - insert returns a promise
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      await repository.insertGroupCurrency(groupId, currencyCode, exchangeRate);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_currencies");
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        group_id: groupId,
        currency_code: currencyCode,
        exchange_rate: exchangeRate,
      });
    });

    it("should_throw_error_when_insert_fails", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const exchangeRate = 4.5;
      const errorMessage = "Insert failed";
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.insert.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Act & Assert
      await expect(repository.insertGroupCurrency(groupId, currencyCode, exchangeRate)).rejects.toThrow(
        "Failed to insert currency"
      );
    });

    it("should_call_supabase_with_correct_data", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const exchangeRate = 4.5;
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      await repository.insertGroupCurrency(groupId, currencyCode, exchangeRate);

      // Assert
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        group_id: groupId,
        currency_code: currencyCode,
        exchange_rate: exchangeRate,
      });
    });
  });

  describe("updateGroupCurrencyRate", () => {
    it("should_update_rate_successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const exchangeRate = 5.0;
      // Mock the update chain: from().update().eq().eq()
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.update.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      await repository.updateGroupCurrencyRate(groupId, currencyCode, exchangeRate);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_currencies");
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ exchange_rate: exchangeRate });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("group_id", groupId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("currency_code", currencyCode);
    });

    it("should_throw_error_when_update_fails", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const exchangeRate = 5.0;
      const errorMessage = "Update failed";
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient); // First eq() returns builder
      mockSupabaseClient.eq.mockResolvedValue({
        // Second eq() returns promise
        data: null,
        error: { message: errorMessage },
      });

      // Act & Assert
      await expect(repository.updateGroupCurrencyRate(groupId, currencyCode, exchangeRate)).rejects.toThrow(
        "Failed to update currency rate"
      );
    });

    it("should_call_supabase_with_correct_filters", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const exchangeRate = 5.0;
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.update.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      await repository.updateGroupCurrencyRate(groupId, currencyCode, exchangeRate);

      // Assert
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ exchange_rate: exchangeRate });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("group_id", groupId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("currency_code", currencyCode);
    });
  });

  describe("deleteGroupCurrency", () => {
    it("should_delete_currency_successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      // Mock the delete chain: from().delete().eq().eq()
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.delete.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      await repository.deleteGroupCurrency(groupId, currencyCode);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_currencies");
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("group_id", groupId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("currency_code", currencyCode);
    });

    it("should_throw_error_when_delete_fails", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const errorMessage = "Delete failed";
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.delete.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient); // First eq() returns builder
      mockSupabaseClient.eq.mockResolvedValue({
        // Second eq() returns promise
        data: null,
        error: { message: errorMessage },
      });

      // Act & Assert
      await expect(repository.deleteGroupCurrency(groupId, currencyCode)).rejects.toThrow("Failed to delete currency");
    });
  });

  describe("checkCurrencyUsageInExpenses", () => {
    it("should_return_true_when_expenses_found", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      mockSupabaseClient.limit.mockResolvedValue({
        data: [{ id: "expense-1" }],
        error: null,
      });

      // Act
      const result = await repository.checkCurrencyUsageInExpenses(groupId, currencyCode);

      // Assert
      expect(result).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("expenses");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("id");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("group_id", groupId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("currency_code", currencyCode);
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(1);
    });

    it("should_return_false_when_no_expenses_found", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      mockSupabaseClient.limit.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await repository.checkCurrencyUsageInExpenses(groupId, currencyCode);

      // Assert
      expect(result).toBe(false);
    });

    it("should_throw_error_when_query_fails", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const errorMessage = "Query failed";
      mockSupabaseClient.limit.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Act & Assert
      await expect(repository.checkCurrencyUsageInExpenses(groupId, currencyCode)).rejects.toThrow(
        "Failed to check currency usage"
      );
      await expect(repository.checkCurrencyUsageInExpenses(groupId, currencyCode)).rejects.toThrow(errorMessage);
    });
  });

  describe("fetchExchangeRate", () => {
    it("should_return_exchange_rate_when_found", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      mockSupabaseClient.single.mockResolvedValue({
        data: { exchange_rate: 4.5 },
        error: null,
      });

      // Act
      const result = await repository.fetchExchangeRate(groupId, currencyCode);

      // Assert
      expect(result).toBe(4.5);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_currencies");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("exchange_rate");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("group_id", groupId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("currency_code", currencyCode);
    });

    it("should_return_null_when_currency_not_in_group", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });

      // Act
      const result = await repository.fetchExchangeRate(groupId, currencyCode);

      // Assert
      expect(result).toBeNull();
    });

    it("should_throw_error_when_query_fails_with_non_pgrst116_error", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const errorMessage = "Database error";
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: "OTHER_ERROR", message: errorMessage },
      });

      // Act & Assert
      await expect(repository.fetchExchangeRate(groupId, currencyCode)).rejects.toThrow(
        "Failed to fetch exchange rate"
      );
      await expect(repository.fetchExchangeRate(groupId, currencyCode)).rejects.toThrow(errorMessage);
    });
  });

  describe("fetchGroupCurrencies", () => {
    it("should_return_formatted_currencies_list", async () => {
      // Arrange
      const groupId = "group-123";
      const mockData = [
        {
          currency_code: "USD",
          exchange_rate: 1.0,
          currencies: { name: "US Dollar" },
        },
        {
          currency_code: "EUR",
          exchange_rate: 4.5,
          currencies: { name: "Euro" },
        },
      ];
      mockSupabaseClient.order.mockResolvedValue({
        data: mockData,
        error: null,
      });

      // Act
      const result = await repository.fetchGroupCurrencies(groupId);

      // Assert
      expect(result).toEqual([
        { code: "USD", name: "US Dollar", exchange_rate: 1.0 },
        { code: "EUR", name: "Euro", exchange_rate: 4.5 },
      ]);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_currencies");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(
        expect.stringMatching(/currency_code,\s*exchange_rate,\s*currencies\s*\(\s*name\s*\)/)
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("group_id", groupId);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith("currency_code");
    });

    it("should_return_empty_array_when_no_currencies", async () => {
      // Arrange
      const groupId = "group-123";
      mockSupabaseClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await repository.fetchGroupCurrencies(groupId);

      // Assert
      expect(result).toEqual([]);
    });

    it("should_throw_error_when_fetch_fails", async () => {
      // Arrange
      const groupId = "group-123";
      const errorMessage = "Fetch failed";
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Act & Assert
      await expect(repository.fetchGroupCurrencies(groupId)).rejects.toThrow("Failed to fetch group currencies");
      await expect(repository.fetchGroupCurrencies(groupId)).rejects.toThrow(errorMessage);
    });
  });

  describe("fetchAllCurrencies", () => {
    it("should_return_all_currencies_ordered_by_code", async () => {
      // Arrange
      const mockCurrencies = [
        { code: "EUR", name: "Euro" },
        { code: "GBP", name: "British Pound" },
        { code: "USD", name: "US Dollar" },
      ];
      mockSupabaseClient.order.mockResolvedValue({
        data: mockCurrencies,
        error: null,
      });

      // Act
      const result = await repository.fetchAllCurrencies();

      // Assert
      expect(result).toEqual(mockCurrencies);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("currencies");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("code, name");
      expect(mockSupabaseClient.order).toHaveBeenCalledWith("code");
    });

    it("should_return_empty_array_when_no_currencies", async () => {
      // Arrange
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act
      const result = await repository.fetchAllCurrencies();

      // Assert
      expect(result).toEqual([]);
    });

    it("should_throw_error_when_fetch_fails", async () => {
      // Arrange
      const errorMessage = "Database connection failed";
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      });

      // Act & Assert
      await expect(repository.fetchAllCurrencies()).rejects.toThrow("Failed to fetch currencies");
      await expect(repository.fetchAllCurrencies()).rejects.toThrow(errorMessage);
    });
  });
});
