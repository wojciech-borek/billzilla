import { describe, it, expect, beforeEach, vi } from "vitest";
import type { APIContext } from "astro";
import { GET as getCurrencies, POST as addCurrency } from "@/pages/api/groups/[groupId]/currencies/index";
import { PATCH as updateCurrency, DELETE as deleteCurrency } from "@/pages/api/groups/[groupId]/currencies/[code]";
import * as groupService from "@/lib/services/groupService";
import * as currencyService from "@/lib/services/currencyService";
import * as memberService from "@/lib/services/memberService";
import { createMockSupabaseClient, type MockSupabaseClient } from "../../services/testHelpers";

// Mock services
vi.mock("@/lib/services/groupService");
vi.mock("@/lib/services/memberService");
vi.mock("@/lib/services/currencyService", async (importActual) => {
  const actual = (await importActual()) as any;
  return {
    ...actual,
    addCurrencyToGroup: vi.fn(),
    updateCurrencyRate: vi.fn(),
    removeCurrencyFromGroup: vi.fn(),
    getGroupCurrencies: vi.fn(),
  };
});

describe("Currency API Endpoints", () => {
  let mockContext: Partial<APIContext>;
  let mockSupabaseClient: MockSupabaseClient;
  const VALID_GROUP_ID = "550e8400-e29b-41d4-a716-446655440000";
  const VALID_USER_ID = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();

    mockContext = {
      params: { groupId: VALID_GROUP_ID },
      request: new Request(`http://localhost/api/groups/${VALID_GROUP_ID}/currencies`, {
        method: "GET",
      }),
      locals: {
        user: {
          id: VALID_USER_ID,
          email: "test@example.com",
          full_name: "Test User",
          avatar_url: null,
        },
        supabase: mockSupabaseClient as never,
      },
    };
  });

  describe("GET /api/groups/:groupId/currencies", () => {
    it("should_return_200_with_currencies_when_user_is_member", async () => {
      // Arrange
      const mockCurrencies = {
        base_currency: { code: "PLN", name: "Polish Zloty", exchange_rate: 1.0 },
        additional_currencies: [{ code: "EUR", name: "Euro", exchange_rate: 4.5 }],
      };
      vi.mocked(groupService.getGroupCurrencies).mockResolvedValue(mockCurrencies);

      // Act
      const response = await getCurrencies(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockCurrencies);
      expect(groupService.getGroupCurrencies).toHaveBeenCalledWith(
        mockContext.locals?.supabase,
        VALID_GROUP_ID,
        VALID_USER_ID
      );
    });

    it("should_return_401_when_user_not_authenticated", async () => {
      // Arrange
      mockContext.locals = { ...mockContext.locals, user: null } as never;

      // Act
      const response = await getCurrencies(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error.code).toBe("UNAUTHORIZED");
      expect(groupService.getGroupCurrencies).not.toHaveBeenCalled();
    });

    it("should_return_400_when_group_id_missing", async () => {
      // Arrange
      mockContext.params = {};

      // Act
      const response = await getCurrencies(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe("INVALID_REQUEST");
    });

    it("should_return_404_when_user_not_member", async () => {
      // Arrange
      vi.mocked(groupService.getGroupCurrencies).mockRejectedValue(
        new Error("Group not found or you are not a member")
      );

      // Act
      const response = await getCurrencies(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error.code).toBe("NOT_FOUND");
    });

    it("should_return_500_on_unexpected_error", async () => {
      // Arrange
      vi.mocked(groupService.getGroupCurrencies).mockRejectedValue(new Error("Database error"));

      // Act
      const response = await getCurrencies(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });

  describe("POST /api/groups/:groupId/currencies", () => {
    beforeEach(() => {
      mockContext.request = new Request(`http://localhost/api/groups/${VALID_GROUP_ID}/currencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency_code: "EUR", exchange_rate: 4.5 }),
      });
    });

    it("should_return_201_when_currency_added_successfully", async () => {
      // Arrange
      const mockAddedCurrency = { code: "EUR", name: "Euro", exchange_rate: 4.5 };
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(true);
      vi.mocked(memberService.verifyGroupCreator).mockResolvedValue(true);
      vi.mocked(currencyService.addCurrencyToGroup).mockResolvedValue(mockAddedCurrency);

      // Act
      const response = await addCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toEqual(mockAddedCurrency);
    });

    it("should_return_401_when_user_not_authenticated", async () => {
      // Arrange
      mockContext.locals = { ...mockContext.locals, user: null } as never;

      // Act
      const response = await addCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should_return_400_when_group_id_missing", async () => {
      // Arrange
      mockContext.params = {};

      // Act
      const response = await addCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe("INVALID_REQUEST");
    });

    it("should_return_403_when_user_not_member", async () => {
      // Arrange
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(false);

      // Act
      const response = await addCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should_return_403_when_user_not_creator", async () => {
      // Arrange
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(true);
      vi.mocked(memberService.verifyGroupCreator).mockResolvedValue(false);

      // Act
      const response = await addCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error.message).toContain("Only the group creator");
    });

    it("should_return_400_when_request_body_invalid_json", async () => {
      // Arrange
      mockContext.request = new Request(`http://localhost/api/groups/${VALID_GROUP_ID}/currencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(true);
      vi.mocked(memberService.verifyGroupCreator).mockResolvedValue(true);

      // Act
      const response = await addCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe("INVALID_JSON");
    });

    it("should_return_404_when_currency_not_found_in_system", async () => {
      // Arrange
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(true);
      vi.mocked(memberService.verifyGroupCreator).mockResolvedValue(true);
      vi.mocked(currencyService.addCurrencyToGroup).mockRejectedValue(
        new currencyService.CurrencyOperationError("add currency", "Currency with code 'XXX' does not exist")
      );

      // Act
      const response = await addCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error.code).toBe("CURRENCY_NOT_FOUND");
    });

    it("should_return_409_when_currency_already_exists_in_group", async () => {
      // Arrange
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(true);
      vi.mocked(memberService.verifyGroupCreator).mockResolvedValue(true);
      vi.mocked(currencyService.addCurrencyToGroup).mockRejectedValue(
        new currencyService.CurrencyOperationError("add currency", "Currency already exists in group")
      );

      // Act
      const response = await addCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.error.code).toBe("CURRENCY_ALREADY_EXISTS");
    });

    it("should_return_422_when_trying_to_add_base_currency", async () => {
      // Arrange
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(true);
      vi.mocked(memberService.verifyGroupCreator).mockResolvedValue(true);
      vi.mocked(currencyService.addCurrencyToGroup).mockRejectedValue(
        new currencyService.CurrencyOperationError("add currency", "Cannot add base currency")
      );

      // Act
      const response = await addCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(422);
      expect(data.error.code).toBe("CANNOT_ADD_BASE_CURRENCY");
    });
  });

  describe("PATCH /api/groups/:groupId/currencies/:code", () => {
    beforeEach(() => {
      mockContext.params = { groupId: VALID_GROUP_ID, code: "EUR" };
      mockContext.request = new Request(`http://localhost/api/groups/${VALID_GROUP_ID}/currencies/EUR`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchange_rate: 5.0 }),
      });
    });

    it("should_return_200_when_rate_updated_successfully", async () => {
      // Arrange
      const mockUpdatedCurrency = { code: "EUR", name: "Euro", exchange_rate: 5.0 };
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(true);
      vi.mocked(memberService.verifyGroupCreator).mockResolvedValue(true);
      vi.mocked(currencyService.updateCurrencyRate).mockResolvedValue(mockUpdatedCurrency);

      // Act
      const response = await updateCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockUpdatedCurrency);
    });

    it("should_return_401_when_user_not_authenticated", async () => {
      // Arrange
      mockContext.locals = { ...mockContext.locals, user: null } as never;

      // Act
      const response = await updateCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should_return_400_when_group_id_or_code_missing", async () => {
      // Arrange
      mockContext.params = { groupId: VALID_GROUP_ID };

      // Act
      const response = await updateCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe("INVALID_REQUEST");
    });

    it("should_return_403_when_user_not_member", async () => {
      // Arrange
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(false);

      // Act
      const response = await updateCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should_return_403_when_user_not_creator", async () => {
      // Arrange
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(true);
      vi.mocked(memberService.verifyGroupCreator).mockResolvedValue(false);

      // Act
      const response = await updateCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error.message).toContain("Only the group creator");
    });

    it("should_return_403_when_trying_to_update_base_currency", async () => {
      // Arrange
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(true);
      vi.mocked(memberService.verifyGroupCreator).mockResolvedValue(true);
      vi.mocked(currencyService.updateCurrencyRate).mockRejectedValue(
        new currencyService.CurrencyOperationError("update currency rate", "Cannot update base currency")
      );

      // Act
      const response = await updateCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error.code).toBe("CANNOT_UPDATE_BASE_CURRENCY");
    });
  });

  describe("DELETE /api/groups/:groupId/currencies/:code", () => {
    beforeEach(() => {
      mockContext.params = { groupId: VALID_GROUP_ID, code: "EUR" };
      mockContext.request = new Request(`http://localhost/api/groups/${VALID_GROUP_ID}/currencies/EUR`, {
        method: "DELETE",
      });
    });

    it("should_return_200_when_currency_removed_successfully", async () => {
      // Arrange
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(true);
      vi.mocked(memberService.verifyGroupCreator).mockResolvedValue(true);
      vi.mocked(currencyService.removeCurrencyFromGroup).mockResolvedValue(undefined);

      // Act
      const response = await deleteCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe("Currency removed from group");
      expect(data.currency_code).toBe("EUR");
    });

    it("should_return_401_when_user_not_authenticated", async () => {
      // Arrange
      mockContext.locals = { ...mockContext.locals, user: null } as never;

      // Act
      const response = await deleteCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should_return_400_when_group_id_or_code_missing", async () => {
      // Arrange
      mockContext.params = { groupId: VALID_GROUP_ID };

      // Act
      const response = await deleteCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe("INVALID_REQUEST");
    });

    it("should_return_403_when_user_not_member", async () => {
      // Arrange
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(false);

      // Act
      const response = await deleteCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should_return_403_when_user_not_creator", async () => {
      // Arrange
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(true);
      vi.mocked(memberService.verifyGroupCreator).mockResolvedValue(false);

      // Act
      const response = await deleteCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error.message).toContain("Only the group creator");
    });

    it("should_return_403_when_trying_to_remove_base_currency", async () => {
      // Arrange
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(true);
      vi.mocked(memberService.verifyGroupCreator).mockResolvedValue(true);
      vi.mocked(currencyService.removeCurrencyFromGroup).mockRejectedValue(
        new currencyService.CurrencyOperationError("remove currency", "Cannot remove base currency")
      );

      // Act
      const response = await deleteCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error.code).toBe("CANNOT_REMOVE_BASE_CURRENCY");
    });

    it("should_return_409_when_currency_used_in_expenses", async () => {
      // Arrange
      vi.mocked(memberService.verifyGroupMembership).mockResolvedValue(true);
      vi.mocked(memberService.verifyGroupCreator).mockResolvedValue(true);
      vi.mocked(currencyService.removeCurrencyFromGroup).mockRejectedValue(
        new currencyService.CurrencyOperationError("remove currency", "Currency is used in existing expenses")
      );

      // Act
      const response = await deleteCurrency(mockContext as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.error.code).toBe("CURRENCY_IN_USE");
    });
  });
});
