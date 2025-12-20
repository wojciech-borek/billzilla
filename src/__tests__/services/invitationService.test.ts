/**
 * Integration tests for invitation service
 * Tests full invitation flow with mocked Supabase client
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createInvitationForExistingUser,
  createInvitationForNewUser,
  acceptInvitation,
  declineInvitation,
  findUserByEmail,
  InvitationOperationError,
  InvitationNotFoundError,
  InvitationAccessError,
  InvitationAlreadyProcessedError,
} from "../../lib/services/invitationService";
import { createMockSupabaseClient, resetMockSupabaseClient, type MockSupabaseClient } from "./testHelpers";

let mockSupabaseClient: MockSupabaseClient;

beforeEach(() => {
  mockSupabaseClient = createMockSupabaseClient();
  resetMockSupabaseClient(mockSupabaseClient);
  vi.clearAllMocks();
});

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

const createMockInvitation = (
  overrides: Partial<{
    id: string;
    email: string;
    status: "pending" | "accepted" | "declined";
    invitee_profile_id: string | null;
    group_id: string;
  }> = {}
) => ({
  id: "inv-123",
  email: "user@example.com",
  status: "pending" as const,
  invitee_profile_id: "user-123",
  group_id: "group-123",
  created_at: "2025-11-06T10:00:00Z",
  ...overrides,
});

const createMockGroupData = (
  overrides: Partial<{
    id: string;
    name: string;
  }> = {}
) => ({
  id: "group-123",
  name: "Test Group",
  ...overrides,
});

const createMockProfile = (
  overrides: Partial<{
    id: string;
    email: string;
    full_name: string;
  }> = {}
) => ({
  id: "user-123",
  email: "user@example.com",
  full_name: "Test User",
  ...overrides,
});

// =============================================================================
// TESTS
// =============================================================================

describe("InvitationService Integration Tests", () => {
  describe("createInvitationForExistingUser", () => {
    it("should create invitation for existing user successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const email = "user@example.com";
      const inviteeProfileId = "user-123";

      // Mock user membership check (not a member)
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" }, // No membership found
      });

      // Mock pending invitation check (no existing invitation)
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" }, // No pending invitation
      });

      // Mock invitation creation
      const expectedInvitation = createMockInvitation();
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.insert.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: expectedInvitation,
        error: null,
      });

      // Act
      const result = await createInvitationForExistingUser(mockSupabaseClient, groupId, email, inviteeProfileId);

      // Assert
      expect(result).toEqual(expectedInvitation);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_members");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("invitations");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("invitations");
    });

    it("should throw error when user is already a member", async () => {
      // Arrange
      const groupId = "group-123";
      const email = "user@example.com";
      const inviteeProfileId = "user-123";

      // Mock user membership check (is a member)
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { profile_id: inviteeProfileId },
        error: null,
      });

      // Act & Assert
      await expect(
        createInvitationForExistingUser(mockSupabaseClient, groupId, email, inviteeProfileId)
      ).rejects.toThrow(InvitationOperationError);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_members");
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1); // Should not proceed to invitation checks
    });

    it("should throw error when pending invitation already exists", async () => {
      // Arrange
      const groupId = "group-123";
      const email = "user@example.com";
      const inviteeProfileId = "user-123";

      // Mock user membership check (not a member)
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Mock pending invitation check (existing invitation found)
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: createMockInvitation(),
        error: null,
      });

      // Act & Assert
      await expect(
        createInvitationForExistingUser(mockSupabaseClient, groupId, email, inviteeProfileId)
      ).rejects.toThrow(InvitationOperationError);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("group_members");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("invitations");
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2); // Should not proceed to invitation creation
    });
  });

  describe("createInvitationForNewUser", () => {
    it("should create invitation for new user successfully", async () => {
      // Arrange
      const groupId = "group-123";
      const email = "newuser@example.com";

      // Mock pending invitation check (no existing invitation)
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Mock invitation creation
      const expectedInvitation = createMockInvitation({
        email: "newuser@example.com",
        invitee_profile_id: null,
      });
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.insert.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: expectedInvitation,
        error: null,
      });

      // Act
      const result = await createInvitationForNewUser(mockSupabaseClient, groupId, email);

      // Assert
      expect(result).toEqual(expectedInvitation);
      expect(result.invitee_profile_id).toBeNull();
    });

    it("should throw error when pending invitation already exists", async () => {
      // Arrange
      const groupId = "group-123";
      const email = "newuser@example.com";

      // Mock pending invitation check (existing invitation found)
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.is.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: createMockInvitation({ email: "newuser@example.com" }),
        error: null,
      });

      // Act & Assert
      await expect(createInvitationForNewUser(mockSupabaseClient, groupId, email)).rejects.toThrow(
        InvitationOperationError
      );
    });
  });


  describe("acceptInvitation", () => {
    it("should accept invitation and add user to group successfully", async () => {
      // Arrange
      const invitationId = "inv-123";
      const userId = "user-123";
      const groupId = "group-123";
      const groupName = "Test Group";

      const mockInvitationData = {
        id: invitationId,
        email: "user@example.com",
        status: "pending",
        invitee_profile_id: userId,
        group_id: groupId,
        groups: { id: groupId, name: groupName },
      };

      // 1. Mock invitation fetch
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockInvitationData,
        error: null,
      });

      // 2. Mock membership check (not a member)
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // 3. Mock RPC transaction
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      const result = await acceptInvitation(mockSupabaseClient, invitationId, userId);

      // Assert
      expect(result).toEqual({
        message: "Invitation accepted successfully. You have been added to the group.",
        invitation_id: invitationId,
        group_id: groupId,
        group_name: groupName,
      });

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("accept_invitation_transaction", {
        p_invitation_id: invitationId,
        p_user_id: userId,
      });
    });

    it("should throw InvitationNotFoundError when invitation doesn't exist", async () => {
      // Arrange
      const invitationId = "non-existent-inv";
      const userId = "user-123";

      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Act & Assert
      await expect(acceptInvitation(mockSupabaseClient, invitationId, userId)).rejects.toThrow(InvitationNotFoundError);
    });

    it("should throw InvitationAccessError when user doesn't own invitation", async () => {
      // Arrange
      const invitationId = "inv-123";
      const userId = "user-456"; // Different user

      const mockInvitationData = {
        id: invitationId,
        email: "user@example.com",
        status: "pending",
        invitee_profile_id: "user-123", // Different user owns this
        group_id: "group-123",
        groups: createMockGroupData(),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockInvitationData,
        error: null,
      });

      // Mock user email fetch
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: createMockProfile({ id: "user-456", email: "other@example.com" }),
        error: null,
      });

      // Act & Assert
      await expect(acceptInvitation(mockSupabaseClient, invitationId, userId)).rejects.toThrow(InvitationAccessError);
    });

    it("should throw InvitationAlreadyProcessedError when invitation is not pending", async () => {
      // Arrange
      const invitationId = "inv-123";
      const userId = "user-123";

      const mockInvitationData = {
        id: invitationId,
        email: "user@example.com",
        status: "accepted", // Already processed
        invitee_profile_id: userId,
        group_id: "group-123",
        groups: createMockGroupData(),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockInvitationData,
        error: null,
      });

      // Act & Assert
      await expect(acceptInvitation(mockSupabaseClient, invitationId, userId)).rejects.toThrow(
        InvitationAlreadyProcessedError
      );
    });
  });

  describe("declineInvitation", () => {

    it("should throw InvitationNotFoundError when invitation doesn't exist", async () => {
      // Arrange
      const invitationId = "non-existent-inv";
      const userId = "user-123";

      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Act & Assert
      await expect(declineInvitation(mockSupabaseClient, invitationId, userId)).rejects.toThrow(
        InvitationNotFoundError
      );
    });

    it("should throw InvitationAccessError when user doesn't own invitation", async () => {
      // Arrange
      const invitationId = "inv-123";
      const userId = "user-456"; // Different user

      const mockInvitationData = {
        id: invitationId,
        email: "user@example.com",
        status: "pending",
        invitee_profile_id: "user-123", // Different user owns this
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockInvitationData,
        error: null,
      });

      // Mock user email fetch
      mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: createMockProfile({ id: "user-456", email: "other@example.com" }),
        error: null,
      });

      // Act & Assert
      await expect(declineInvitation(mockSupabaseClient, invitationId, userId)).rejects.toThrow(InvitationAccessError);
    });

    it("should throw InvitationAlreadyProcessedError when invitation is not pending", async () => {
      // Arrange
      const invitationId = "inv-123";
      const userId = "user-123";

      const mockInvitationData = {
        id: invitationId,
        email: "user@example.com",
        status: "accepted", // Already processed
        invitee_profile_id: userId,
      };

      // Counter to track which query this is
      let queryCounter = 0;

      mockSupabaseClient.from.mockImplementation((_table: string) => {
        queryCounter++;
        const queryBuilder = {
          ...mockSupabaseClient,
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() => {
            if (queryCounter === 1) {
              // Invitation fetch
              return Promise.resolve({
                data: mockInvitationData,
                error: null,
              });
            } else if (queryCounter === 2) {
              // User email fetch
              return Promise.resolve({
                data: createMockProfile(),
                error: null,
              });
            }
            return Promise.resolve({ data: null, error: null });
          }),
        };
        return queryBuilder;
      });

      // Act & Assert
      await expect(declineInvitation(mockSupabaseClient, invitationId, userId)).rejects.toThrow(
        InvitationAlreadyProcessedError
      );
    });
  });

  describe("findUserByEmail", () => {
    it("should return user ID when user exists", async () => {
      // Arrange
      const email = "user@example.com";
      const expectedUserId = "user-123";

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: expectedUserId,
        error: null,
      });

      // Act
      const result = await findUserByEmail(mockSupabaseClient, email);

      // Assert
      expect(result).toBe(expectedUserId);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("find_user_by_email_safe", {
        email_to_find: email,
      });
    });

    it("should return null when user doesn't exist", async () => {
      // Arrange
      const email = "nonexistent@example.com";

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      const result = await findUserByEmail(mockSupabaseClient, email);

      // Assert
      expect(result).toBeNull();
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("find_user_by_email_safe", {
        email_to_find: email,
      });
    });

    it("should throw error when query fails", async () => {
      // Arrange
      const email = "user@example.com";

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Database connection failed" },
      });

      // Act & Assert
      await expect(findUserByEmail(mockSupabaseClient, email)).rejects.toThrow(InvitationOperationError);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("find_user_by_email_safe", {
        email_to_find: email,
      });
    });
  });
});
