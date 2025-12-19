import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  validateCurrencyExists,
  fetchGroupCurrencies,
  getAllCurrencies,
  getExchangeRate,
  convertCurrency,
  addCurrencyToGroup,
  updateCurrencyRate,
  checkCurrencyUsageInExpenses,
  removeCurrencyFromGroup,
  CurrencyOperationError,
} from "@/lib/services/currencyService";
import { CurrencyRepository } from "@/lib/services/repositories/CurrencyRepository";
import { createMockSupabaseClient, resetMockSupabaseClient, type MockSupabaseClient } from "./testHelpers";

let mockSupabaseClient: MockSupabaseClient;

beforeEach(() => {
  mockSupabaseClient = createMockSupabaseClient();
  resetMockSupabaseClient(mockSupabaseClient);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CurrencyService", () => {
  describe("validateCurrencyExists", () => {
    it("should_return_true_when_currency_exists", async () => {
      // Arrange
      const currencyCode = "USD";
      vi.spyOn(CurrencyRepository.prototype, "verifyCurrencyExists").mockResolvedValue(true);

      // Act
      const result = await validateCurrencyExists(mockSupabaseClient, currencyCode);

      // Assert
      expect(result).toBe(true);
      expect(CurrencyRepository.prototype.verifyCurrencyExists).toHaveBeenCalledWith(currencyCode);
    });

    it("should_throw_error_when_currency_does_not_exist", async () => {
      // Arrange
      const currencyCode = "INV";
      vi.spyOn(CurrencyRepository.prototype, "verifyCurrencyExists").mockResolvedValue(false);

      // Act & Assert
      await expect(validateCurrencyExists(mockSupabaseClient, currencyCode)).rejects.toThrow(CurrencyOperationError);
      await expect(validateCurrencyExists(mockSupabaseClient, currencyCode)).rejects.toThrow("does not exist");
    });

    it("should_throw_error_when_currency_code_is_empty", async () => {
      // Arrange
      const currencyCode = "";

      // Act & Assert
      await expect(validateCurrencyExists(mockSupabaseClient, currencyCode)).rejects.toThrow(CurrencyOperationError);
      await expect(validateCurrencyExists(mockSupabaseClient, currencyCode)).rejects.toThrow("required");
    });
  });

  describe("fetchGroupCurrencies", () => {
    it("should_return_group_currencies_when_group_exists", async () => {
      // Arrange
      const groupId = "group-123";
      const mockCurrencies = [
        { code: "USD", name: "US Dollar", exchange_rate: 1.0 },
        { code: "EUR", name: "Euro", exchange_rate: 4.5 },
      ];
      vi.spyOn(CurrencyRepository.prototype, "fetchGroupCurrencies").mockResolvedValue(mockCurrencies);

      // Act
      const result = await fetchGroupCurrencies(mockSupabaseClient, groupId);

      // Assert
      expect(result).toEqual(mockCurrencies);
      expect(CurrencyRepository.prototype.fetchGroupCurrencies).toHaveBeenCalledWith(groupId);
    });

    it("should_throw_error_when_group_id_is_empty", async () => {
      // Arrange
      const groupId = "";

      // Act & Assert
      await expect(fetchGroupCurrencies(mockSupabaseClient, groupId)).rejects.toThrow(CurrencyOperationError);
      await expect(fetchGroupCurrencies(mockSupabaseClient, groupId)).rejects.toThrow("required");
    });

    it("should_throw_error_when_repository_fails", async () => {
      // Arrange
      const groupId = "group-123";
      const errorMessage = "Database connection failed";
      vi.spyOn(CurrencyRepository.prototype, "fetchGroupCurrencies").mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(fetchGroupCurrencies(mockSupabaseClient, groupId)).rejects.toThrow(CurrencyOperationError);
      await expect(fetchGroupCurrencies(mockSupabaseClient, groupId)).rejects.toThrow(errorMessage);
    });
  });

  describe("getAllCurrencies", () => {
    it("should_return_all_currencies_from_system", async () => {
      // Arrange
      const mockCurrencies = [
        { code: "USD", name: "US Dollar" },
        { code: "EUR", name: "Euro" },
        { code: "GBP", name: "British Pound" },
      ];
      vi.spyOn(CurrencyRepository.prototype, "fetchAllCurrencies").mockResolvedValue(mockCurrencies);

      // Act
      const result = await getAllCurrencies(mockSupabaseClient);

      // Assert
      expect(result).toEqual(mockCurrencies);
      expect(CurrencyRepository.prototype.fetchAllCurrencies).toHaveBeenCalled();
    });

    it("should_throw_error_when_fetch_fails", async () => {
      // Arrange
      const errorMessage = "Failed to fetch currencies";
      vi.spyOn(CurrencyRepository.prototype, "fetchAllCurrencies").mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(getAllCurrencies(mockSupabaseClient)).rejects.toThrow(CurrencyOperationError);
      await expect(getAllCurrencies(mockSupabaseClient)).rejects.toThrow(errorMessage);
    });
  });

  describe("getExchangeRate", () => {
    it("should_return_exchange_rate_when_currency_exists_in_group", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const exchangeRate = 4.5;
      vi.spyOn(CurrencyRepository.prototype, "fetchExchangeRate").mockResolvedValue(exchangeRate);

      // Act
      const result = await getExchangeRate(mockSupabaseClient, groupId, currencyCode);

      // Assert
      expect(result).toBe(exchangeRate);
      expect(CurrencyRepository.prototype.fetchExchangeRate).toHaveBeenCalledWith(groupId, currencyCode);
    });

    it("should_return_1_when_currency_not_found", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      vi.spyOn(CurrencyRepository.prototype, "fetchExchangeRate").mockResolvedValue(null);

      // Act
      const result = await getExchangeRate(mockSupabaseClient, groupId, currencyCode);

      // Assert
      expect(result).toBe(1.0);
    });

    it("should_throw_error_when_group_id_is_empty", async () => {
      // Arrange
      const groupId = "";
      const currencyCode = "EUR";

      // Act & Assert
      await expect(getExchangeRate(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow(CurrencyOperationError);
      await expect(getExchangeRate(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow("required");
    });

    it("should_throw_error_when_currency_code_is_empty", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "";

      // Act & Assert
      await expect(getExchangeRate(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow(CurrencyOperationError);
      await expect(getExchangeRate(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow("required");
    });
  });

  describe("convertCurrency", () => {
    it("should_convert_currency_correctly_using_exchange_rates", async () => {
      // Arrange
      const groupId = "group-123";
      const amount = 100;
      const fromCurrency = "EUR";
      const toCurrency = "PLN";

      const fetchExchangeRateSpy = vi.spyOn(CurrencyRepository.prototype, "fetchExchangeRate");
      fetchExchangeRateSpy.mockResolvedValueOnce(4.5); // EUR
      fetchExchangeRateSpy.mockResolvedValueOnce(1.0); // PLN

      // Act
      const result = await convertCurrency(mockSupabaseClient, groupId, amount, fromCurrency, toCurrency);

      // Assert
      expect(result).toBe(450);
    });

    it("should_return_same_amount_when_converting_to_same_currency", async () => {
      // Arrange
      const groupId = "group-123";
      const amount = 100;
      const currency = "EUR";

      // Act
      const result = await convertCurrency(mockSupabaseClient, groupId, amount, currency, currency);

      // Assert
      expect(result).toBe(amount);
    });

    it("should_convert_between_two_non_base_currencies", async () => {
      // Arrange
      const groupId = "group-123";
      const amount = 100;
      const fromCurrency = "EUR";
      const toCurrency = "GBP";

      const fetchExchangeRateSpy = vi.spyOn(CurrencyRepository.prototype, "fetchExchangeRate");
      fetchExchangeRateSpy.mockResolvedValueOnce(4.5); // EUR
      fetchExchangeRateSpy.mockResolvedValueOnce(5.0); // GBP

      // Act
      const result = await convertCurrency(mockSupabaseClient, groupId, amount, fromCurrency, toCurrency);

      // Assert
      expect(result).toBe(90);
    });

    it("should_throw_error_when_group_id_is_empty", async () => {
      // Arrange
      const groupId = "";
      const amount = 100;
      const fromCurrency = "EUR";

      // Act & Assert
      await expect(convertCurrency(mockSupabaseClient, groupId, amount, fromCurrency)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(convertCurrency(mockSupabaseClient, groupId, amount, fromCurrency)).rejects.toThrow("required");
    });

    it("should_throw_error_when_amount_is_invalid", async () => {
      // Arrange
      const groupId = "group-123";
      const invalidAmount = NaN;
      const fromCurrency = "EUR";

      // Act & Assert
      await expect(convertCurrency(mockSupabaseClient, groupId, invalidAmount, fromCurrency)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(convertCurrency(mockSupabaseClient, groupId, invalidAmount, fromCurrency)).rejects.toThrow(
        "required"
      );
    });

    it("should_throw_error_when_from_currency_is_empty", async () => {
      // Arrange
      const groupId = "group-123";
      const amount = 100;
      const fromCurrency = "";

      // Act & Assert
      await expect(convertCurrency(mockSupabaseClient, groupId, amount, fromCurrency)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(convertCurrency(mockSupabaseClient, groupId, amount, fromCurrency)).rejects.toThrow("required");
    });
  });

  describe("addCurrencyToGroup", () => {
    it("should_add_currency_successfully_when_valid_data", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const exchangeRate = 4.5;

      vi.spyOn(CurrencyRepository.prototype, "verifyCurrencyExists").mockResolvedValue(true);
      vi.spyOn(CurrencyRepository.prototype, "fetchGroupBaseCurrency").mockResolvedValue("PLN");
      vi.spyOn(CurrencyRepository.prototype, "checkCurrencyExistsInGroup").mockResolvedValue(false);
      vi.spyOn(CurrencyRepository.prototype, "insertGroupCurrency").mockResolvedValue(undefined);
      vi.spyOn(CurrencyRepository.prototype, "fetchCurrencyByCode").mockResolvedValue({ code: "EUR", name: "Euro" });

      // Act
      const result = await addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate);

      // Assert
      expect(result).toEqual({
        code: "EUR",
        name: "Euro",
        exchange_rate: 4.5,
      });
      expect(CurrencyRepository.prototype.verifyCurrencyExists).toHaveBeenCalledWith(currencyCode);
      expect(CurrencyRepository.prototype.fetchGroupBaseCurrency).toHaveBeenCalledWith(groupId);
      expect(CurrencyRepository.prototype.checkCurrencyExistsInGroup).toHaveBeenCalledWith(groupId, currencyCode);
      expect(CurrencyRepository.prototype.insertGroupCurrency).toHaveBeenCalledWith(
        groupId,
        currencyCode,
        exchangeRate
      );
    });

    it("should_throw_error_when_currency_does_not_exist_in_system", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "INV";
      const exchangeRate = 4.5;

      vi.spyOn(CurrencyRepository.prototype, "verifyCurrencyExists").mockResolvedValue(false);

      // Act & Assert
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        "does not exist"
      );
    });

    it("should_throw_error_when_trying_to_add_base_currency", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "USD";
      const exchangeRate = 1.0;

      vi.spyOn(CurrencyRepository.prototype, "verifyCurrencyExists").mockResolvedValue(true);
      vi.spyOn(CurrencyRepository.prototype, "fetchGroupBaseCurrency").mockResolvedValue("USD");

      // Act & Assert
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        "Cannot add base currency"
      );
    });

    it("should_throw_error_when_currency_already_exists_in_group", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const exchangeRate = 4.5;

      vi.spyOn(CurrencyRepository.prototype, "verifyCurrencyExists").mockResolvedValue(true);
      vi.spyOn(CurrencyRepository.prototype, "fetchGroupBaseCurrency").mockResolvedValue("PLN");
      vi.spyOn(CurrencyRepository.prototype, "checkCurrencyExistsInGroup").mockResolvedValue(true);

      // Act & Assert
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        "already exists in group"
      );
    });

    it("should_throw_error_when_group_id_is_empty", async () => {
      // Arrange
      const groupId = "";
      const currencyCode = "EUR";
      const exchangeRate = 4.5;

      // Act & Assert
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        "required"
      );
    });

    it("should_throw_error_when_currency_code_is_empty", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "";
      const exchangeRate = 4.5;

      // Act & Assert
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        "required"
      );
    });

    it("should_throw_error_when_exchange_rate_is_zero", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const exchangeRate = 0;

      // Act & Assert
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        "required"
      );
    });

    it("should_throw_error_when_exchange_rate_is_negative", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const exchangeRate = -1;

      // Act & Assert
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        "required"
      );
    });

    it("should_throw_error_when_group_not_found", async () => {
      // Arrange
      const groupId = "invalid-group";
      const currencyCode = "EUR";
      const exchangeRate = 4.5;

      vi.spyOn(CurrencyRepository.prototype, "verifyCurrencyExists").mockResolvedValue(true);
      vi.spyOn(CurrencyRepository.prototype, "fetchGroupBaseCurrency").mockResolvedValue(null);

      // Act & Assert
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(addCurrencyToGroup(mockSupabaseClient, groupId, currencyCode, exchangeRate)).rejects.toThrow(
        "Group not found"
      );
    });
  });

  describe("updateCurrencyRate", () => {
    it("should_update_currency_rate_successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const newExchangeRate = 5.0;

      vi.spyOn(CurrencyRepository.prototype, "fetchGroupBaseCurrency").mockResolvedValue("PLN");
      vi.spyOn(CurrencyRepository.prototype, "updateGroupCurrencyRate").mockResolvedValue(undefined);
      vi.spyOn(CurrencyRepository.prototype, "fetchCurrencyByCode").mockResolvedValue({ code: "EUR", name: "Euro" });

      // Act
      const result = await updateCurrencyRate(mockSupabaseClient, groupId, currencyCode, newExchangeRate);

      // Assert
      expect(result).toEqual({
        code: "EUR",
        name: "Euro",
        exchange_rate: 5.0,
      });
      expect(CurrencyRepository.prototype.fetchGroupBaseCurrency).toHaveBeenCalledWith(groupId);
      expect(CurrencyRepository.prototype.updateGroupCurrencyRate).toHaveBeenCalledWith(
        groupId,
        currencyCode,
        newExchangeRate
      );
    });

    it("should_throw_error_when_trying_to_update_base_currency", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "USD";
      const newExchangeRate = 1.5;

      vi.spyOn(CurrencyRepository.prototype, "fetchGroupBaseCurrency").mockResolvedValue("USD");

      // Act & Assert
      await expect(updateCurrencyRate(mockSupabaseClient, groupId, currencyCode, newExchangeRate)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(updateCurrencyRate(mockSupabaseClient, groupId, currencyCode, newExchangeRate)).rejects.toThrow(
        "Cannot update base currency"
      );
    });

    it("should_throw_error_when_group_id_is_empty", async () => {
      // Arrange
      const groupId = "";
      const currencyCode = "EUR";
      const newExchangeRate = 5.0;

      // Act & Assert
      await expect(updateCurrencyRate(mockSupabaseClient, groupId, currencyCode, newExchangeRate)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(updateCurrencyRate(mockSupabaseClient, groupId, currencyCode, newExchangeRate)).rejects.toThrow(
        "required"
      );
    });

    it("should_throw_error_when_currency_code_is_empty", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "";
      const newExchangeRate = 5.0;

      // Act & Assert
      await expect(updateCurrencyRate(mockSupabaseClient, groupId, currencyCode, newExchangeRate)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(updateCurrencyRate(mockSupabaseClient, groupId, currencyCode, newExchangeRate)).rejects.toThrow(
        "required"
      );
    });

    it("should_throw_error_when_new_exchange_rate_is_invalid", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      const newExchangeRate = 0;

      // Act & Assert
      await expect(updateCurrencyRate(mockSupabaseClient, groupId, currencyCode, newExchangeRate)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(updateCurrencyRate(mockSupabaseClient, groupId, currencyCode, newExchangeRate)).rejects.toThrow(
        "required"
      );
    });

    it("should_throw_error_when_group_not_found", async () => {
      // Arrange
      const groupId = "invalid-group";
      const currencyCode = "EUR";
      const newExchangeRate = 5.0;

      vi.spyOn(CurrencyRepository.prototype, "fetchGroupBaseCurrency").mockResolvedValue(null);

      // Act & Assert
      await expect(updateCurrencyRate(mockSupabaseClient, groupId, currencyCode, newExchangeRate)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(updateCurrencyRate(mockSupabaseClient, groupId, currencyCode, newExchangeRate)).rejects.toThrow(
        "Group not found"
      );
    });
  });

  describe("checkCurrencyUsageInExpenses", () => {
    it("should_return_true_when_currency_is_used_in_expenses", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      vi.spyOn(CurrencyRepository.prototype, "checkCurrencyUsageInExpenses").mockResolvedValue(true);

      // Act
      const result = await checkCurrencyUsageInExpenses(mockSupabaseClient, groupId, currencyCode);

      // Assert
      expect(result).toBe(true);
      expect(CurrencyRepository.prototype.checkCurrencyUsageInExpenses).toHaveBeenCalledWith(groupId, currencyCode);
    });

    it("should_return_false_when_currency_is_not_used", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";
      vi.spyOn(CurrencyRepository.prototype, "checkCurrencyUsageInExpenses").mockResolvedValue(false);

      // Act
      const result = await checkCurrencyUsageInExpenses(mockSupabaseClient, groupId, currencyCode);

      // Assert
      expect(result).toBe(false);
    });

    it("should_throw_error_when_group_id_is_empty", async () => {
      // Arrange
      const groupId = "";
      const currencyCode = "EUR";

      // Act & Assert
      await expect(checkCurrencyUsageInExpenses(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(checkCurrencyUsageInExpenses(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow("required");
    });

    it("should_throw_error_when_currency_code_is_empty", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "";

      // Act & Assert
      await expect(checkCurrencyUsageInExpenses(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(checkCurrencyUsageInExpenses(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow("required");
    });
  });

  describe("removeCurrencyFromGroup", () => {
    it("should_remove_currency_successfully_when_not_used", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";

      vi.spyOn(CurrencyRepository.prototype, "fetchGroupBaseCurrency").mockResolvedValue("PLN");
      vi.spyOn(CurrencyRepository.prototype, "checkCurrencyUsageInExpenses").mockResolvedValue(false);
      vi.spyOn(CurrencyRepository.prototype, "deleteGroupCurrency").mockResolvedValue(undefined);

      // Act
      await removeCurrencyFromGroup(mockSupabaseClient, groupId, currencyCode);

      // Assert
      expect(CurrencyRepository.prototype.fetchGroupBaseCurrency).toHaveBeenCalledWith(groupId);
      expect(CurrencyRepository.prototype.checkCurrencyUsageInExpenses).toHaveBeenCalledWith(groupId, currencyCode);
      expect(CurrencyRepository.prototype.deleteGroupCurrency).toHaveBeenCalledWith(groupId, currencyCode);
    });

    it("should_throw_error_when_trying_to_remove_base_currency", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "USD";

      vi.spyOn(CurrencyRepository.prototype, "fetchGroupBaseCurrency").mockResolvedValue("USD");

      // Act & Assert
      await expect(removeCurrencyFromGroup(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(removeCurrencyFromGroup(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow(
        "Cannot remove base currency"
      );
    });

    it("should_throw_error_when_currency_is_used_in_expenses", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "EUR";

      vi.spyOn(CurrencyRepository.prototype, "fetchGroupBaseCurrency").mockResolvedValue("PLN");
      vi.spyOn(CurrencyRepository.prototype, "checkCurrencyUsageInExpenses").mockResolvedValue(true);

      // Act & Assert
      await expect(removeCurrencyFromGroup(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(removeCurrencyFromGroup(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow(
        "used in existing expenses"
      );
    });

    it("should_throw_error_when_group_id_is_empty", async () => {
      // Arrange
      const groupId = "";
      const currencyCode = "EUR";

      // Act & Assert
      await expect(removeCurrencyFromGroup(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(removeCurrencyFromGroup(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow("required");
    });

    it("should_throw_error_when_currency_code_is_empty", async () => {
      // Arrange
      const groupId = "group-123";
      const currencyCode = "";

      // Act & Assert
      await expect(removeCurrencyFromGroup(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(removeCurrencyFromGroup(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow("required");
    });

    it("should_throw_error_when_group_not_found", async () => {
      // Arrange
      const groupId = "invalid-group";
      const currencyCode = "EUR";

      vi.spyOn(CurrencyRepository.prototype, "fetchGroupBaseCurrency").mockResolvedValue(null);

      // Act & Assert
      await expect(removeCurrencyFromGroup(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow(
        CurrencyOperationError
      );
      await expect(removeCurrencyFromGroup(mockSupabaseClient, groupId, currencyCode)).rejects.toThrow(
        "Group not found"
      );
    });
  });

  describe("CurrencyOperationError", () => {
    it("should_create_error_with_correct_name_and_message", () => {
      // Arrange
      const operation = "test operation";
      const details = "test details";

      // Act
      const error = new CurrencyOperationError(operation, details);

      // Assert
      expect(error.name).toBe("CurrencyOperationError");
      expect(error.message).toContain(operation);
      expect(error.message).toContain(details);
    });
  });
});
