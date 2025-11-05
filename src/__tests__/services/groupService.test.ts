import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createGroup,
  listGroups,
  getGroupCurrencies,
  getGroupDetails,
  CurrencyNotFoundError,
  TransactionError,
} from "@/lib/services/groupService";
import {
  createMockCreateGroupCommand,
  createMockSupabaseClient,
  resetMockSupabaseClient,
  type MockSupabaseClient,
} from "./testHelpers";

let mockSupabaseClient: MockSupabaseClient;

beforeEach(() => {
  mockSupabaseClient = createMockSupabaseClient();
  resetMockSupabaseClient(mockSupabaseClient);
});

describe("GroupService", () => {
  describe("createGroup", () => {
    it("should_create_group_successfully_when_valid_currency_and_data", async () => {
      // Arrange
      const command = createMockCreateGroupCommand();
      const userId = "user-123";

      // Mock currency validation success
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { code: "USD" },
        error: null,
      });

      // Mock RPC call success
      const mockGroupData = {
        id: "group-123",
        name: "Test Group",
        base_currency_code: "USD",
        status: "active",
        created_at: "2024-01-01T00:00:00Z",
        added_members: [
          {
            profile_id: "member-1",
            email: "user1@test.com",
            full_name: "User One",
            status: "active",
          },
        ],
        created_invitations: [
          {
            id: "inv-1",
            email: "user2@test.com",
            status: "pending",
          },
        ],
      };
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [mockGroupData],
        error: null,
      });

      // Act
      const result = await createGroup(mockSupabaseClient, command, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("currencies");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("code");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("code", "USD");
      expect(mockSupabaseClient.single).toHaveBeenCalled();

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("create_group_transaction", {
        p_group_name: "Test Group",
        p_base_currency_code: "USD",
        p_creator_id: "user-123",
        p_invite_emails: ["user1@test.com", "user2@test.com"],
      });

      expect(result).toEqual({
        id: "group-123",
        name: "Test Group",
        base_currency_code: "USD",
        status: "active",
        created_at: "2024-01-01T00:00:00Z",
        role: "creator",
        invitations: {
          added_members: [
            {
              profile_id: "member-1",
              email: "user1@test.com",
              full_name: "User One",
              status: "active",
            },
          ],
          created_invitations: [
            {
              id: "inv-1",
              email: "user2@test.com",
              status: "pending",
            },
          ],
        },
      });
    });

    it("should_throw_currency_not_found_when_invalid_base_currency", async () => {
      // Arrange

      const command = createMockCreateGroupCommand({
        base_currency_code: "INVALID",
        invite_emails: [],
      });
      const userId = "user-123";

      // Mock currency validation failure
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "Currency not found" },
      });

      // Act & Assert
      await expect(createGroup(mockSupabaseClient, command, userId)).rejects.toThrow(CurrencyNotFoundError);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("currencies");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("code");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("code", "INVALID");
      expect(mockSupabaseClient.single).toHaveBeenCalled();

      // RPC should not be called when currency validation fails
      expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();
    });

    it("should_throw_transaction_error_when_rpc_fails", async () => {
      // Arrange

      const command = createMockCreateGroupCommand({
        invite_emails: [],
      });
      const userId = "user-123";

      // Mock currency validation success
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { code: "USD" },
        error: null,
      });

      // Mock RPC call failure
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Transaction failed" },
      });

      // Act & Assert
      await expect(createGroup(mockSupabaseClient, command, userId)).rejects.toThrow(TransactionError);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("currencies");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("code");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("code", "USD");
      expect(mockSupabaseClient.single).toHaveBeenCalled();

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("create_group_transaction", {
        p_group_name: "Test Group",
        p_base_currency_code: "USD",
        p_creator_id: "user-123",
        p_invite_emails: [],
      });
    });
  });

  describe("listGroups", () => {
    it("should_return_empty_result_when_user_has_no_groups", async () => {
      // Arrange
      const customMockClient = {
        ...mockSupabaseClient,
        from: vi
          .fn()
          .mockReturnValueOnce({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => ({
                    range: vi.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
          })
          .mockReturnValueOnce({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({
                  count: 0,
                  error: null,
                }),
              })),
            })),
          }),
      } as any;

      const userId = "user-no-groups";
      const options = { status: "active" as const, limit: 50, offset: 0 };

      // Act
      const result = await listGroups(customMockClient, userId, options);

      // Assert
      expect(result).toEqual({
        data: [],
        total: 0,
        limit: 50,
        offset: 0,
      });
    });

    it("should_throw_error_when_groups_query_fails", async () => {
      // Arrange
      const userId = "user-123";
      const options = { status: "active" as const, limit: 50, offset: 0 };

      const customMockClient = {
        ...mockSupabaseClient,
        from: vi
          .fn()
          // Groups query fails
          .mockReturnValueOnce({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => ({
                    range: vi.fn().mockResolvedValue({
                      data: null,
                      error: { message: "Database connection failed" },
                    }),
                  })),
                })),
              })),
            })),
          }),
      } as any;

      // Act & Assert
      await expect(listGroups(customMockClient, userId, options)).rejects.toThrow("Failed to fetch groups");

      expect(customMockClient.from).toHaveBeenCalledWith("groups");
    });
  });

  describe("getGroupCurrencies", () => {
    it("should_return_group_currencies_when_user_is_member", async () => {
      // Arrange

      const groupId = "group-123";
      const userId = "user-123";

      // Mock membership verification success
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { group_id: groupId },
        error: null,
      });

      // Mock group base currency
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { base_currency_code: "USD" },
        error: null,
      });

      // Mock currencies data
      const mockCurrenciesData = [
        {
          currency_code: "USD",
          exchange_rate: 1.0,
          currencies: { name: "US Dollar" },
        },
        {
          currency_code: "EUR",
          exchange_rate: 0.85,
          currencies: { name: "Euro" },
        },
        {
          currency_code: "GBP",
          exchange_rate: 0.73,
          currencies: { name: "British Pound" },
        },
      ];
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockCurrenciesData,
        error: null,
      });

      // Act
      const result = await getGroupCurrencies(mockSupabaseClient, groupId, userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_members");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("groups");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_currencies");

      expect(result).toEqual({
        base_currency: {
          code: "USD",
          name: "US Dollar",
          exchange_rate: 1.0,
        },
        additional_currencies: [
          {
            code: "EUR",
            name: "Euro",
            exchange_rate: 0.85,
          },
          {
            code: "GBP",
            name: "British Pound",
            exchange_rate: 0.73,
          },
        ],
      });
    });

    it("should_throw_error_when_user_not_group_member", async () => {
      // Arrange

      const groupId = "group-123";
      const userId = "non-member-user";

      // Mock membership verification failure (no membership found)
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: "No membership found" },
      });

      // Act & Assert
      await expect(getGroupCurrencies(mockSupabaseClient, groupId, userId)).rejects.toThrow(
        "Group not found or you are not a member"
      );

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_members");
      // Should not proceed to other queries
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
    });

    it("should_return_base_currency_fallback_when_currencies_missing", async () => {
      // Arrange

      const groupId = "group-123";
      const userId = "user-123";

      // Mock membership verification success
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { group_id: groupId },
        error: null,
      });

      // Mock group base currency
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { base_currency_code: "USD" },
        error: null,
      });

      // Mock currencies query returns empty data
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: [], // No currencies found
        error: null,
      });

      // Act
      const result = await getGroupCurrencies(mockSupabaseClient, groupId, userId);

      // Assert
      expect(result).toEqual({
        base_currency: {
          code: "USD",
          name: "Unknown Currency",
          exchange_rate: 1.0,
        },
        additional_currencies: [],
      });
    });
  });

  describe("getGroupDetails", () => {
    it("should_return_complete_group_details_when_user_is_member", async () => {
      // Arrange

      const groupId = "group-123";
      const userId = "user-123";

      // Mock verifyGroupMembership query (returns true for membership)
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { group_id: groupId },
        error: null,
      });

      // Mock group with membership query
      const mockGroupData = {
        id: groupId,
        name: "Test Group",
        base_currency_code: "USD",
        status: "active",
        created_at: "2024-01-01T00:00:00Z",
        group_members: [{ role: "member", status: "active", joined_at: "2024-01-01T00:00:00Z" }],
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockGroupData,
        error: null,
      });

      // Mock members query
      const mockMembersData = [
        {
          profile_id: "user-123",
          role: "member",
          status: "active",
          joined_at: "2024-01-01T00:00:00Z",
          profiles: {
            id: "user-123",
            full_name: "Test User",
            email: "test@example.com",
            avatar_url: null,
            updated_at: "2024-01-01T00:00:00Z",
          },
        },
        {
          profile_id: "user-456",
          role: "creator",
          status: "active",
          joined_at: "2024-01-01T00:00:00Z",
          profiles: {
            id: "user-456",
            full_name: "Creator User",
            email: "creator@example.com",
            avatar_url: "avatar-url",
            updated_at: "2024-01-01T00:00:00Z",
          },
        },
      ];
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockMembersData,
        error: null,
      });

      // Mock currencies query
      const mockCurrenciesData = [
        {
          currency_code: "USD",
          exchange_rate: 1.0,
          currencies: { name: "US Dollar" },
        },
        {
          currency_code: "EUR",
          exchange_rate: 0.85,
          currencies: { name: "Euro" },
        },
      ];
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockCurrenciesData,
        error: null,
      });

      // Mock invitations query
      const mockInvitationsData = [
        {
          id: "inv-1",
          email: "pending@example.com",
          status: "pending",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockInvitationsData,
        error: null,
      });

      // Act
      const result = await getGroupDetails(mockSupabaseClient, groupId, userId);

      // Assert
      expect(result).toEqual({
        id: groupId,
        name: "Test Group",
        base_currency_code: "USD",
        status: "active",
        created_at: "2024-01-01T00:00:00Z",
        my_role: "member",
        members: [
          {
            profile_id: "user-123",
            full_name: "Test User",
            email: "test@example.com",
            avatar_url: null,
            role: "member",
            status: "active",
            joined_at: "2024-01-01T00:00:00Z",
          },
          {
            profile_id: "user-456",
            full_name: "Creator User",
            email: "creator@example.com",
            avatar_url: "avatar-url",
            role: "creator",
            status: "active",
            joined_at: "2024-01-01T00:00:00Z",
          },
        ],
        group_currencies: [
          {
            code: "USD",
            name: "US Dollar",
            exchange_rate: 1.0,
          },
          {
            code: "EUR",
            name: "Euro",
            exchange_rate: 0.85,
          },
        ],
        pending_invitations: [
          {
            id: "inv-1",
            email: "pending@example.com",
            status: "pending",
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
      });
    });

    it("should_throw_error_when_group_not_found_or_user_not_member", async () => {
      // Arrange

      const groupId = "invalid-group";
      const userId = "user-123";

      // Mock verifyGroupMembership query returns no membership
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "No membership found" },
      });

      // Act & Assert
      await expect(getGroupDetails(mockSupabaseClient, groupId, userId)).rejects.toThrow(
        "Group not found or you are not a member"
      );

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_members");
      // Should not proceed to other queries
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
    });

    it("should_handle_missing_invitations_gracefully", async () => {
      // Arrange

      const groupId = "group-123";
      const userId = "user-123";

      // Mock verifyGroupMembership query (returns true for membership)
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { group_id: groupId },
        error: null,
      });

      // Mock group with membership query (same as successful test)
      const mockGroupData = {
        id: groupId,
        name: "Test Group",
        base_currency_code: "USD",
        status: "active",
        created_at: "2024-01-01T00:00:00Z",
        group_members: [{ role: "member", status: "active", joined_at: "2024-01-01T00:00:00Z" }],
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockGroupData,
        error: null,
      });

      // Mock members query (same as successful test)
      const mockMembersData = [
        {
          profile_id: "user-123",
          role: "member",
          status: "active",
          joined_at: "2024-01-01T00:00:00Z",
          profiles: {
            id: "user-123",
            full_name: "Test User",
            email: "test@example.com",
            avatar_url: null,
            updated_at: "2024-01-01T00:00:00Z",
          },
        },
      ];
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockMembersData,
        error: null,
      });

      // Mock currencies query (same as successful test)
      const mockCurrenciesData = [
        {
          currency_code: "USD",
          exchange_rate: 1.0,
          currencies: { name: "US Dollar" },
        },
      ];
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: mockCurrenciesData,
        error: null,
      });

      // Mock invitations query to fail
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: null,
        error: { message: "Invitations query failed" },
      });

      // Act
      const result = await getGroupDetails(mockSupabaseClient, groupId, userId);

      // Assert - should still return successfully with empty pending_invitations
      expect(result).toEqual({
        id: groupId,
        name: "Test Group",
        base_currency_code: "USD",
        status: "active",
        created_at: "2024-01-01T00:00:00Z",
        my_role: "member",
        members: [
          {
            profile_id: "user-123",
            full_name: "Test User",
            email: "test@example.com",
            avatar_url: null,
            role: "member",
            status: "active",
            joined_at: "2024-01-01T00:00:00Z",
          },
        ],
        group_currencies: [
          {
            code: "USD",
            name: "US Dollar",
            exchange_rate: 1.0,
          },
        ],
        pending_invitations: [], // Should be empty array despite query failure
      });
    });
  });

  describe("CurrencyNotFoundError", () => {
    it("should_create_currency_not_found_error_with_correct_message", () => {
      // Arrange & Act
      const error = new CurrencyNotFoundError("XYZ");

      // Assert
      expect(error.name).toBe("CurrencyNotFoundError");
      expect(error.message).toBe("Currency with code 'XYZ' does not exist");
    });
  });

  describe("TransactionError", () => {
    it("should_create_transaction_error_with_custom_message", () => {
      // Arrange & Act
      const error = new TransactionError("Database connection failed");

      // Assert
      expect(error.name).toBe("TransactionError");
      expect(error.message).toBe("Database connection failed");
    });
  });
});
