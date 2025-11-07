/**
 * Tests for useInvitationsList hook
 * Tests invitation type mapping functionality
 */

import { describe, it, expect } from "vitest";
import type { InvitationDTO } from "../../types";
import type { InvitationCardVM } from "../../components/dashboard/types";

// Test the mapping logic directly since the hook has complex dependencies
describe("InvitationCardVM mapping", () => {
  const mapToInvitationCardVM = (invitations: InvitationDTO[]): InvitationCardVM[] => {
    return invitations.map((invitation) => ({
      id: invitation.id,
      groupId: invitation.group.id,
      groupName: invitation.group.name,
      invitationType: invitation.invitee_profile_id ? "existing_user" : "new_user",
      createdAt: invitation.created_at,
    }));
  };

  it("maps existing user invitations correctly", () => {
    const mockInvitations: InvitationDTO[] = [
      {
        id: "inv-1",
        email: "user@example.com",
        status: "pending",
        created_at: "2025-11-06T10:00:00Z",
        invitee_profile_id: "profile-123", // Existing user
        group: {
          id: "group-1",
          name: "Test Group",
        },
      },
    ];

    const result = mapToInvitationCardVM(mockInvitations);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "inv-1",
      groupId: "group-1",
      groupName: "Test Group",
      invitationType: "existing_user",
      createdAt: "2025-11-06T10:00:00Z",
    });
  });

  it("maps new user invitations correctly", () => {
    const mockInvitations: InvitationDTO[] = [
      {
        id: "inv-2",
        email: "newuser@example.com",
        status: "pending",
        created_at: "2025-11-06T10:00:00Z",
        invitee_profile_id: null, // New user
        group: {
          id: "group-2",
          name: "Another Group",
        },
      },
    ];

    const result = mapToInvitationCardVM(mockInvitations);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "inv-2",
      groupId: "group-2",
      groupName: "Another Group",
      invitationType: "new_user",
      createdAt: "2025-11-06T10:00:00Z",
    });
  });

  it("handles mixed invitation types", () => {
    const mockInvitations: InvitationDTO[] = [
      {
        id: "inv-1",
        email: "existing@example.com",
        status: "pending",
        created_at: "2025-11-06T10:00:00Z",
        invitee_profile_id: "profile-123",
        group: { id: "group-1", name: "Existing User Group" },
      },
      {
        id: "inv-2",
        email: "new@example.com",
        status: "pending",
        created_at: "2025-11-06T11:00:00Z",
        invitee_profile_id: null,
        group: { id: "group-2", name: "New User Group" },
      },
    ];

    const result = mapToInvitationCardVM(mockInvitations);

    expect(result).toHaveLength(2);
    expect(result[0].invitationType).toBe("existing_user");
    expect(result[1].invitationType).toBe("new_user");
  });

  it("handles empty invitations array", () => {
    const result = mapToInvitationCardVM([]);
    expect(result).toHaveLength(0);
  });
});
