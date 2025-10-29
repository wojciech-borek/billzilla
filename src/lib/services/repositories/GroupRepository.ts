import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import type { GroupStatus, GroupRole } from "../../../types";
import { GroupDataError } from "../errors/groupErrors";

// Type definitions for repository return types
interface UserGroupWithRole {
  id: string;
  name: string;
  description: string | null;
  base_currency_code: string;
  status: GroupStatus;
  created_at: string;
  updated_at: string;
  group_members: {
    role: GroupRole;
  }[];
}

interface GroupWithMembership {
  id: string;
  name: string;
  description: string | null;
  base_currency_code: string;
  status: GroupStatus;
  created_at: string;
  updated_at: string;
  group_members: {
    role: GroupRole;
    status: "active" | "inactive";
    joined_at: string;
  }[];
}

interface GroupBasic {
  base_currency_code: string;
}

interface GroupCurrency {
  currency_code: string;
  exchange_rate: number;
  currencies: {
    name: string;
  };
}

interface PendingInvitation {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

interface CreatedGroupData {
  id: string;
  name: string;
  base_currency_code: string;
}

/**
 * Repository pattern for group-related database operations
 * Encapsulates all data access logic for groups
 */
export class GroupRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Fetch groups where user is a member with their role
   */
  async fetchUserGroupsWithRoles(
    userId: string,
    status: GroupStatus,
    limit: number,
    offset: number
  ): Promise<UserGroupWithRole[]> {
    const { data: userGroups, error: groupsError } = await this.supabase
      .from("groups")
      .select(
        `
        *,
        group_members!inner(role)
      `
      )
      .eq("group_members.profile_id", userId)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (groupsError) {
      throw new GroupDataError("fetch groups", groupsError.message);
    }

    return userGroups || [];
  }

  /**
   * Count total groups for a user with status filter
   */
  async countUserGroups(userId: string, status: GroupStatus): Promise<number> {
    const { count: totalCount, error: countError } = await this.supabase
      .from("groups")
      .select("id, group_members!inner(profile_id)", { count: "exact", head: true })
      .eq("group_members.profile_id", userId)
      .eq("status", status);

    if (countError) {
      throw new GroupDataError("count user groups", countError.message);
    }

    return totalCount || 0;
  }

  /**
   * Fetch detailed group information with user membership
   */
  async fetchGroupWithMembership(groupId: string, userId: string): Promise<GroupWithMembership> {
    const { data: groupData, error: groupError } = await this.supabase
      .from("groups")
      .select(
        `
        *,
        group_members!inner(
          role,
          status,
          joined_at
        )
      `
      )
      .eq("id", groupId)
      .eq("group_members.profile_id", userId)
      .eq("group_members.status", "active")
      .single();

    if (groupError || !groupData) {
      throw new GroupDataError("fetch group with membership", "Group not found or user is not active member");
    }

    return groupData;
  }

  /**
   * Fetch basic group information
   */
  async fetchGroupBasic(groupId: string): Promise<GroupBasic> {
    const { data: group, error: groupError } = await this.supabase
      .from("groups")
      .select("base_currency_code")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      throw new GroupDataError("fetch group basic", "Group not found");
    }

    return group;
  }

  /**
   * Fetch all currencies configured for a group
   */
  async fetchGroupCurrencies(groupId: string): Promise<GroupCurrency[]> {
    const { data: currenciesData, error: currenciesError } = await this.supabase
      .from("group_currencies")
      .select("currency_code, exchange_rate, currencies(name)")
      .eq("group_id", groupId)
      .order("currency_code");

    if (currenciesError) {
      throw new GroupDataError("fetch group currencies", "Failed to fetch currencies");
    }

    return currenciesData || [];
  }

  /**
   * Fetch pending invitations for a group
   */
  async fetchPendingInvitations(groupId: string): Promise<PendingInvitation[]> {
    const { data: invitationsData } = await this.supabase
      .from("invitations")
      .select("id, email, status, created_at")
      .eq("group_id", groupId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Note: invitations errors are not thrown as invitations are optional
    return invitationsData || [];
  }

  /**
   * Verify if user is a member of the group
   */
  async verifyGroupMembership(groupId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("group_members")
      .select("profile_id")
      .eq("group_id", groupId)
      .eq("profile_id", userId)
      .eq("status", "active")
      .single();

    return !error && data !== null;
  }

  /**
   * Create group using RPC function (handles atomic creation with members and currencies)
   */
  async createGroupAtomically(params: {
    groupName: string;
    baseCurrencyCode: string;
    creatorId: string;
    inviteEmails?: string[];
  }): Promise<CreatedGroupData> {
    const { data: newGroupData, error: groupError } = await this.supabase.rpc("create_group_transaction", {
      p_group_name: params.groupName,
      p_base_currency_code: params.baseCurrencyCode,
      p_creator_id: params.creatorId,
      p_invite_emails: params.inviteEmails || undefined,
    });

    if (groupError || !newGroupData || newGroupData.length === 0) {
      throw new GroupDataError(
        "create group atomically",
        `Failed to create group: ${groupError?.message || "Unknown error"}`
      );
    }

    return newGroupData[0];
  }

  /**
   * Extract user role from group membership data
   */
  extractUserRole(groupData: GroupWithMembership): GroupRole {
    const groupMembersData = groupData.group_members as unknown as { role: GroupRole }[];
    return groupMembersData[0]?.role || "member";
  }

  /**
   * Extract user membership details from group data
   */
  extractUserMembership(groupData: GroupWithMembership): {
    role: GroupRole;
    status: "active" | "inactive";
    joined_at: string;
  } {
    const userMembership = groupData.group_members as unknown as {
      role: GroupRole;
      status: "active" | "inactive";
      joined_at: string;
    }[];
    return userMembership[0] || { role: "member", status: "active", joined_at: "" };
  }
}
