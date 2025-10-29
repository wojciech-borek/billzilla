/**
 * Member service - handles business logic for group member operations
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { GroupMemberSummaryDTO } from "../../types";

/**
 * Custom error for member-related operations
 */
export class MemberOperationError extends Error {
  constructor(operation: string, details?: string) {
    super(`Member operation failed during ${operation}${details ? `: ${details}` : ""}`);
    this.name = "MemberOperationError";
  }
}

/**
 * Fetches all active members for the given groups
 *
 * This function retrieves member information including profile data
 * and organizes them by group ID for efficient access.
 *
 * @param supabase - Supabase client instance
 * @param groupIds - Array of group IDs to fetch members for
 * @returns Map of groupId to array of member summaries
 * @throws {MemberOperationError} If data fetching fails
 */
export async function fetchGroupMembers(
  supabase: SupabaseClient,
  groupIds: string[]
): Promise<Map<string, GroupMemberSummaryDTO[]>> {
  // Input validation
  if (!groupIds || groupIds.length === 0) {
    throw new MemberOperationError("fetch group members", "At least one group ID is required");
  }

  const { data: groupMembers, error: membersError } = await supabase
    .from("group_members")
    .select(
      `
      group_id,
      profile_id,
      status,
      role,
      profiles!inner(
        id,
        full_name,
        avatar_url
      )
    `
    )
    .in("group_id", groupIds)
    .eq("status", "active");

  if (membersError) {
    throw new MemberOperationError("fetch group members", membersError.message);
  }

  // Organize members by group
  const membersByGroup = new Map<string, GroupMemberSummaryDTO[]>();

  for (const member of groupMembers || []) {
    const groupId = member.group_id;
    const profile = member.profiles as unknown as { id: string; full_name: string | null; avatar_url: string | null };

    let groupMembersList = membersByGroup.get(groupId);
    if (!groupMembersList) {
      groupMembersList = [];
      membersByGroup.set(groupId, groupMembersList);
    }

    groupMembersList.push({
      profile_id: member.profile_id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      status: member.status,
      role: member.role,
    });
  }

  return membersByGroup;
}

/**
 * Verifies if a user is an active member of a specific group
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group to check membership for
 * @param userId - ID of the user to check membership for
 * @returns true if user is an active member, false otherwise
 * @throws {MemberOperationError} If membership check fails
 */
export async function verifyGroupMembership(
  supabase: SupabaseClient,
  groupId: string,
  userId: string
): Promise<boolean> {
  // Input validation
  if (!groupId) {
    throw new MemberOperationError("verify membership", "Group ID is required");
  }
  if (!userId) {
    throw new MemberOperationError("verify membership", "User ID is required");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("profile_id", userId)
    .eq("status", "active")
    .single();

  if (membershipError && membershipError.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw new MemberOperationError("verify membership", membershipError.message);
  }

  return !!membership;
}

/**
 * Gets detailed member information for a specific group
 *
 * This includes full profile information and membership details
 * for all active members of the group.
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group to fetch members for
 * @returns Array of detailed member information
 * @throws {MemberOperationError} If data fetching fails
 */
export async function getGroupMemberDetails(supabase: SupabaseClient, groupId: string) {
  // Input validation
  if (!groupId) {
    throw new MemberOperationError("get member details", "Group ID is required");
  }

  const { data: membersData, error: membersError } = await supabase
    .from("group_members")
    .select(
      `
      profile_id,
      role,
      status,
      joined_at,
      profiles!inner(
        id,
        full_name,
        email,
        avatar_url,
        updated_at
      )
    `
    )
    .eq("group_id", groupId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  if (membersError) {
    throw new MemberOperationError("get member details", membersError.message);
  }

  // Transform members data
  const members = (membersData || []).map((member) => {
    const profile = member.profiles as unknown as {
      id: string;
      full_name: string | null;
      email: string;
      avatar_url: string | null;
      updated_at: string;
    };

    return {
      profile_id: member.profile_id,
      full_name: profile.full_name,
      email: profile.email,
      avatar_url: profile.avatar_url,
      role: member.role,
      status: member.status,
      joined_at: member.joined_at,
    };
  });

  return members;
}
