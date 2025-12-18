import { describe, it, expect, beforeEach, vi } from "vitest";
import type { APIContext } from "astro";
import { POST } from "../../../pages/api/groups/[groupId]/archive";
import * as groupService from "../../../lib/services/groupService";
import { GroupAccessError, GroupDataError, GroupNotCreatorError } from "../../../lib/services/errors/groupErrors";

// Mock groupService
vi.mock("../../../lib/services/groupService", () => ({
  archiveGroup: vi.fn(),
}));

describe("POST /api/groups/[groupId]/archive", () => {
  let mockContext: Partial<APIContext>;
  const VALID_GROUP_ID = "550e8400-e29b-41d4-a716-446655440000"; // Valid UUID

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      params: { groupId: VALID_GROUP_ID },
      request: new Request(`http://localhost/api/groups/${VALID_GROUP_ID}/archive`, {
        method: "POST",
      }),
      locals: {
        user: {
          id: "user-123",
          email: "test@example.com",
          full_name: "Test User",
          avatar_url: null,
        },
        supabase: {} as never,
      },
    };
  });

  describe("should return 401 when user not authenticated", () => {
    it("should return UNAUTHORIZED error when user is null", async () => {
      // Arrange
      mockContext.locals = { ...mockContext.locals, user: null } as never;

      // Act
      const response = await POST(mockContext as APIContext);

      // Assert
      expect(response.status).toBe(401);
    });

    it("should not call archiveGroup when user is not authenticated", async () => {
      // Arrange
      mockContext.locals = { ...mockContext.locals, user: null } as never;

      // Act
      await POST(mockContext as APIContext);

      // Assert
      expect(groupService.archiveGroup).not.toHaveBeenCalled();
    });
  });

  describe("should return 400 when groupId is invalid", () => {
    it("should return VALIDATION_ERROR when groupId is empty", async () => {
      // Arrange
      mockContext.params = { groupId: "" };

      // Act
      const response = await POST(mockContext as APIContext);

      // Assert
      expect(response.status).toBe(400);
    });

    it("should not call archiveGroup when groupId is invalid", async () => {
      // Arrange
      mockContext.params = { groupId: "" };

      // Act
      await POST(mockContext as APIContext);

      // Assert
      expect(groupService.archiveGroup).not.toHaveBeenCalled();
    });
  });

  describe("should return 200 and archived group when successful", () => {
    it("should return archived group data on successful archive", async () => {
      // Arrange
      const mockArchivedGroup = {
        id: VALID_GROUP_ID,
        name: "Test Group",
        base_currency_code: "USD",
        status: "archived" as const,
        created_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(groupService.archiveGroup).mockResolvedValue(mockArchivedGroup);

      // Act
      const response = await POST(mockContext as APIContext);

      // Assert
      expect(response.status).toBe(200);
      expect(groupService.archiveGroup).toHaveBeenCalledWith(mockContext.locals?.supabase, VALID_GROUP_ID, "user-123");
    });
  });

  describe("should return 403 when user is not creator", () => {
    it("should return FORBIDDEN error when GroupNotCreatorError is thrown", async () => {
      // Arrange
      vi.mocked(groupService.archiveGroup).mockRejectedValue(new GroupNotCreatorError());

      // Act
      const response = await POST(mockContext as APIContext);

      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe("should return 404 when group not found", () => {
    it("should return NOT_FOUND error when GroupAccessError is thrown", async () => {
      // Arrange
      vi.mocked(groupService.archiveGroup).mockRejectedValue(new GroupAccessError());

      // Act
      const response = await POST(mockContext as APIContext);

      // Assert
      expect(response.status).toBe(404);
    });

    it("should return NOT_FOUND error when GroupDataError is thrown", async () => {
      // Arrange
      vi.mocked(groupService.archiveGroup).mockRejectedValue(new GroupDataError("archive group", "Group not found"));

      // Act
      const response = await POST(mockContext as APIContext);

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe("should return 500 on unexpected errors", () => {
    it("should return INTERNAL_SERVER_ERROR on unexpected error", async () => {
      // Arrange
      vi.mocked(groupService.archiveGroup).mockRejectedValue(new Error("Unexpected database error"));

      // Act
      const response = await POST(mockContext as APIContext);

      // Assert
      expect(response.status).toBe(500);
    });
  });
});
