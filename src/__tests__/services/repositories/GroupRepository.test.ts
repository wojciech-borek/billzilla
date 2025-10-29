import { describe, it, expect, beforeEach, vi } from "vitest";
import { GroupRepository } from "../../../lib/services/repositories/GroupRepository";
import {
  setupRepositoryTest,
  mockGroupRepositoryQuery,
  mockRpcQuery,
  mockMembershipVerification,
} from "../testHelpers";

describe("GroupRepository", () => {
  let mockSupabaseClient: any;
  let groupRepository: GroupRepository;

  beforeEach(() => {
    const testSetup = setupRepositoryTest(GroupRepository);
    mockSupabaseClient = testSetup.mockSupabaseClient;
    groupRepository = testSetup.repository;
  });

  describe("fetchUserGroupsWithRoles", () => {
    it("should fetch user groups with roles successfully", async () => {
      // Arrange
      const userId = "user-123";
      const status = "active" as const;
      const limit = 10;
      const offset = 0;
      const mockGroups = [
        {
          id: "group-1",
          name: "Group 1",
          base_currency_code: "USD",
          group_members: [{ role: "admin" }],
        },
        {
          id: "group-2",
          name: "Group 2",
          base_currency_code: "EUR",
          group_members: [{ role: "member" }],
        },
      ];

      mockGroupRepositoryQuery(mockSupabaseClient, "groups", {
        data: mockGroups,
        error: null,
      });

      // Act
      const result = await groupRepository.fetchUserGroupsWithRoles(userId, status, limit, offset);

      // Assert
      expect(result).toEqual(mockGroups);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("groups");
    });
  });

  describe("countUserGroups", () => {
    it("should count user groups by status", async () => {
      // Arrange
      const userId = "user-123";
      const status = "active" as const;
      const expectedCount = 5;

      const queryBuilder = mockGroupRepositoryQuery(mockSupabaseClient, "groups", {
        count: expectedCount,
        error: null,
      });

      // Mock the chained eq calls for count query
      queryBuilder.eq.mockReturnValueOnce(queryBuilder);
      queryBuilder.eq.mockResolvedValueOnce({
        count: expectedCount,
        error: null,
      });

      // Act
      const result = await groupRepository.countUserGroups(userId, status);

      // Assert
      expect(result).toBe(expectedCount);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("groups");
    });
  });

  describe("fetchGroupWithMembership", () => {
    it("should fetch group with membership details", async () => {
      // Arrange
      const groupId = "group-123";
      const userId = "user-456";
      const mockGroupData = {
        id: groupId,
        name: "Test Group",
        base_currency_code: "USD",
        group_members: [
          {
            role: "admin",
            status: "active",
            joined_at: "2024-01-01T00:00:00Z",
          },
        ],
      };

      mockGroupRepositoryQuery(mockSupabaseClient, "groups", {
        data: mockGroupData,
        error: null,
      });

      // Act
      const result = await groupRepository.fetchGroupWithMembership(groupId, userId);

      // Assert
      expect(result).toEqual(mockGroupData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("groups");
    });
  });

  describe("fetchGroupBasic", () => {
    it("should fetch basic group information", async () => {
      // Arrange
      const groupId = "group-123";
      const mockGroupData = {
        base_currency_code: "USD",
      };

      mockGroupRepositoryQuery(mockSupabaseClient, "groups", {
        data: mockGroupData,
        error: null,
      });

      // Act
      const result = await groupRepository.fetchGroupBasic(groupId);

      // Assert
      expect(result).toEqual(mockGroupData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("groups");
    });
  });

  describe("fetchGroupCurrencies", () => {
    it("should fetch group currencies ordered", async () => {
      // Arrange
      const groupId = "group-123";
      const mockCurrencies = [
        {
          currency_code: "EUR",
          exchange_rate: 1.2,
          currencies: { name: "Euro" },
        },
        {
          currency_code: "USD",
          exchange_rate: 1.0,
          currencies: { name: "US Dollar" },
        },
      ];

      mockGroupRepositoryQuery(mockSupabaseClient, "group_currencies", {
        data: mockCurrencies,
        error: null,
      });

      // Act
      const result = await groupRepository.fetchGroupCurrencies(groupId);

      // Assert
      expect(result).toEqual(mockCurrencies);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_currencies");
    });
  });

  describe("fetchPendingInvitations", () => {
    it("should fetch pending invitations ordered by date", async () => {
      // Arrange
      const groupId = "group-123";
      const mockInvitations = [
        {
          id: "inv-1",
          email: "user1@test.com",
          status: "pending",
          created_at: "2024-01-02T00:00:00Z",
        },
        {
          id: "inv-2",
          email: "user2@test.com",
          status: "pending",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      mockGroupRepositoryQuery(mockSupabaseClient, "invitations", {
        data: mockInvitations,
        error: null,
      });

      // Act
      const result = await groupRepository.fetchPendingInvitations(groupId);

      // Assert
      expect(result).toEqual(mockInvitations);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("invitations");
    });
  });

  describe("verifyGroupMembership", () => {
    it("should verify active group membership", async () => {
      // Arrange
      const groupId = "group-123";
      const userId = "user-456";

      mockMembershipVerification(mockSupabaseClient, true);

      // Act
      const result = await groupRepository.verifyGroupMembership(groupId, userId);

      // Assert
      expect(result).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_members");
    });
  });

  describe("createGroupAtomically", () => {
    it("should create group atomically with members and currencies", async () => {
      // Arrange
      const params = {
        groupName: "Test Group",
        baseCurrencyCode: "USD",
        creatorId: "user-123",
        inviteEmails: ["user1@test.com", "user2@test.com"],
      };
      const mockNewGroup = {
        id: "group-123",
        name: "Test Group",
        base_currency_code: "USD",
      };

      mockRpcQuery(mockSupabaseClient, "create_group_transaction", {
        data: [mockNewGroup],
        error: null,
      });

      // Act
      const result = await groupRepository.createGroupAtomically(params);

      // Assert
      expect(result).toEqual(mockNewGroup);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("create_group_transaction", {
        p_group_name: params.groupName,
        p_base_currency_code: params.baseCurrencyCode,
        p_creator_id: params.creatorId,
        p_invite_emails: params.inviteEmails,
      });
    });
  });

  describe("extractUserRole", () => {
    it("should extract user role from group data", () => {
      // Arrange
      const groupData = {
        group_members: [{ role: "admin" }],
      };

      // Act
      const result = groupRepository.extractUserRole(groupData);

      // Assert
      expect(result).toBe("admin");
    });
  });

  describe("extractUserMembership", () => {
    it("should extract user membership details", () => {
      // Arrange
      const groupData = {
        group_members: [
          {
            role: "member",
            status: "active",
            joined_at: "2024-01-01T00:00:00Z",
          },
        ],
      };

      // Act
      const result = groupRepository.extractUserMembership(groupData);

      // Assert
      expect(result).toEqual({
        role: "member",
        status: "active",
        joined_at: "2024-01-01T00:00:00Z",
      });
    });
  });
});
