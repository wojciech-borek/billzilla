/**
 * Group service - handles business logic for group operations
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { calculateUserBalances } from "./balanceService";
import { fetchGroupMembers, getGroupMemberDetails, verifyGroupMembership } from "./memberService";
import { validateCurrencyExists } from "./currencyService";
import type {
  CreateGroupCommand,
  CreateGroupResponseDTO,
  InvitationResultDTO,
  GroupRole,
  GroupListItemDTO,
  GroupMemberSummaryDTO,
  GroupDetailDTO,
  GroupCurrencyDTO,
  GroupCurrenciesDTO,
  PendingInvitationDTO,
  PaginatedResponse,
  GroupStatus,
} from "../../types";

/**
 * Custom error for currency not found
 */
export class CurrencyNotFoundError extends Error {
  constructor(currencyCode: string) {
    super(`Currency with code '${currencyCode}' does not exist`);
    this.name = "CurrencyNotFoundError";
  }
}

/**
 * Custom error for transaction failures
 */
export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionError";
  }
}

/**
 * Custom error for group not found or access denied
 */
export class GroupAccessError extends Error {
  constructor(message = "Group not found or you are not a member") {
    super(message);
    this.name = "GroupAccessError";
  }
}

/**
 * Custom error for group data fetch failures
 */
export class GroupDataError extends Error {
  constructor(operation: string, details?: string) {
    super(`Failed to ${operation}${details ? `: ${details}` : ""}`);
    this.name = "GroupDataError";
  }
}

/**
 * Creates a new group with the creator as the first member
 *
 * This function performs the following operations in a transaction:
 * 1. Validates that the base currency exists
 * 2. Creates the group record
 * 3. Adds the creator as a member with 'creator' role
 * 4. Adds the base currency to group_currencies with exchange rate 1.0
 * 5. Optionally processes invitation emails (best-effort, non-blocking)
 *
 * @param supabase - Supabase client instance
 * @param command - Group creation data
 * @param userId - ID of the user creating the group
 * @returns Created group with invitation results
 * @throws {CurrencyNotFoundError} If the base currency doesn't exist
 * @throws {TransactionError} If the transaction fails
 */
export async function createGroup(
  supabase: SupabaseClient<Database>,
  command: CreateGroupCommand,
  userId: string
): Promise<CreateGroupResponseDTO> {
  // Input validation
  if (!userId) {
    throw new GroupDataError("create group", "User ID is required");
  }
  if (!command.name?.trim()) {
    throw new GroupDataError("create group", "Group name is required");
  }
  if (!command.base_currency_code) {
    throw new GroupDataError("create group", "Base currency code is required");
  }

  try {
    // Validate that base currency exists
    const currencyExists = await validateCurrencyExists(supabase, command.base_currency_code);
    if (!currencyExists) {
      throw new CurrencyNotFoundError(command.base_currency_code);
    }

    // Step 2-5: Create group atomically using RPC function
    // This function runs as SECURITY DEFINER (bypasses RLS) and handles invitations atomically

    // Create group atomically using RPC function
    const { data: newGroupData, error: groupError } = await supabase.rpc("create_group_transaction", {
      p_group_name: command.name,
      p_base_currency_code: command.base_currency_code,
      p_creator_id: userId,
      p_invite_emails: command.invite_emails || undefined,
    });

    if (groupError || !newGroupData || newGroupData.length === 0) {
      throw new TransactionError(`Failed to create group: ${groupError?.message || "Unknown error"}`);
    }

    const newGroup = newGroupData[0];

    // Parse invitation results from the database function
    const invitationResults: InvitationResultDTO = {
      added_members: Array.isArray(newGroup.added_members)
        ? newGroup.added_members.map((member: any) => ({
            profile_id: member.profile_id,
            email: member.email,
            full_name: member.full_name,
            status: member.status,
          }))
        : [],
      created_invitations: Array.isArray(newGroup.created_invitations)
        ? newGroup.created_invitations.map((inv: any) => ({
            id: inv.id,
            email: inv.email,
            status: inv.status,
          }))
        : [],
    };

    // Return the complete response
    const { added_members, created_invitations, ...groupData } = newGroup;
    return {
      ...groupData,
      role: "creator" as GroupRole,
      invitations: invitationResults,
    };
  } catch (error) {
    // Re-throw custom errors as-is
    if (error instanceof CurrencyNotFoundError || error instanceof TransactionError) {
      throw error;
    }
    // Convert currency operation errors for non-existent currencies to CurrencyNotFoundError
    if (error instanceof Error && error.name === "CurrencyOperationError" && error.message.includes("does not exist")) {
      throw new CurrencyNotFoundError(command.base_currency_code);
    }
    // Wrap unexpected errors
    throw new GroupDataError("create group", error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Fetches groups where user is a member with their role
 */
async function fetchUserGroupsWithRoles(
  supabase: SupabaseClient<Database>,
  userId: string,
  status: GroupStatus,
  limit: number,
  offset: number
) {
  const { data: userGroups, error: groupsError } = await supabase
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

  return userGroups;
}

/**
 * Counts total groups for a user with pagination
 */
async function countUserGroups(
  supabase: SupabaseClient<Database>,
  userId: string,
  status: GroupStatus
): Promise<number> {
  const { count: totalCount, error: countError } = await supabase
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
 * Composes the final GroupListItemDTO array
 */
function composeGroupListItems(
  userGroups: any[],
  balancesByGroup: Map<string, number>,
  membersByGroup: Map<string, GroupMemberSummaryDTO[]>
): GroupListItemDTO[] {
  return userGroups.map((group) => {
    // Extract role from group_members relation
    const groupMembersData = group.group_members as unknown as { role: GroupRole }[];
    const role = groupMembersData[0]?.role || "member";

    return {
      id: group.id,
      name: group.name,
      base_currency_code: group.base_currency_code,
      status: group.status,
      created_at: group.created_at,
      role,
      my_balance: balancesByGroup.get(group.id) || 0,
      members: membersByGroup.get(group.id) || [],
    };
  });
}

/**
 * Lists groups for a user with computed fields
 *
 * This function performs the following operations:
 * 1. Fetches groups where user is a member with their role
 * 2. Fetches full list of active members for each group
 * 3. Calculates user's balance in base currency for each group
 * 4. Returns paginated results
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user requesting the list
 * @param options - Query options (status, limit, offset)
 * @returns Paginated list of groups with computed fields
 * @throws {GroupDataError} If any data fetching operation fails
 */
export async function listGroups(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: {
    status?: GroupStatus;
    limit?: number;
    offset?: number;
  }
): Promise<PaginatedResponse<GroupListItemDTO>> {
  // Input validation
  if (!userId) {
    throw new GroupDataError("list groups", "User ID is required");
  }

  const { status = "active", limit = 50, offset = 0 } = options;

  // Validate pagination parameters
  if (limit <= 0 || limit > 100) {
    throw new GroupDataError("list groups", "Limit must be between 1 and 100");
  }
  if (offset < 0) {
    throw new GroupDataError("list groups", "Offset must be non-negative");
  }

  try {
    // Fetch user groups with roles
    const userGroups = await fetchUserGroupsWithRoles(supabase, userId, status, limit, offset);

    // Get total count for pagination
    const total = await countUserGroups(supabase, userId, status);

    // Early return for empty results
    if (!userGroups || userGroups.length === 0) {
      return {
        data: [],
        total,
        limit,
        offset,
      };
    }

    const groupIds = userGroups.map((g) => g.id);

    // Fetch group members and balances in parallel
    const [membersByGroup, balancesByGroup] = await Promise.all([
      fetchGroupMembers(supabase, groupIds),
      calculateUserBalances(supabase, userId, groupIds),
    ]);

    // Compose final response
    const groupListItems = composeGroupListItems(userGroups, balancesByGroup, membersByGroup);

    return {
      data: groupListItems,
      total,
      limit,
      offset,
    };
  } catch (error) {
    // Re-throw custom errors as-is
    if (error instanceof GroupDataError) {
      throw error;
    }
    // Wrap unexpected errors
    throw new GroupDataError("list groups", error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Gets currencies available in a specific group
 *
 * This function performs the following operations:
 * 1. Verifies user is a member of the group
 * 2. Fetches all currencies available in the group
 * 3. Separates base currency from additional currencies
 * 4. Returns GroupCurrenciesDTO
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group to fetch currencies for
 * @param userId - ID of the requesting user (for membership verification)
 * @returns Group currencies information
 * @throws {Error} If group not found or user is not a member
 */
export async function getGroupCurrencies(
  supabase: SupabaseClient<Database>,
  groupId: string,
  userId: string
): Promise<GroupCurrenciesDTO> {
  // Input validation
  if (!groupId) {
    throw new GroupDataError("get group currencies", "Group ID is required");
  }
  if (!userId) {
    throw new GroupDataError("get group currencies", "User ID is required");
  }

  try {
    // Verify user is a member of the group
    const isMember = await verifyGroupMembership(supabase, groupId, userId);
    if (!isMember) {
      throw new GroupAccessError();
    }

    // Get group base currency
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("base_currency_code")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      throw new GroupDataError("get group currencies", "Group not found");
    }

    // Fetch all currencies for the group
    const { data: currenciesData, error: currenciesError } = await supabase
      .from("group_currencies")
      .select("currency_code, exchange_rate, currencies(name)")
      .eq("group_id", groupId)
      .order("currency_code");

    if (currenciesError) {
      throw new GroupDataError("get group currencies", "Failed to fetch currencies");
    }

    // Transform currencies data
    const groupCurrencies: GroupCurrencyDTO[] = (currenciesData || []).map((gc) => {
      const currency = gc.currencies as unknown as { name: string };
      return {
        code: gc.currency_code,
        name: currency.name,
        exchange_rate: gc.exchange_rate,
      };
    });

    // Separate base currency from additional currencies
    const baseCurrency = groupCurrencies.find((gc) => gc.code === group.base_currency_code);
    const additionalCurrencies = groupCurrencies.filter((gc) => gc.code !== group.base_currency_code);

    return {
      base_currency: baseCurrency || {
        code: group.base_currency_code,
        name: "Unknown Currency",
        exchange_rate: 1.0,
      },
      additional_currencies: additionalCurrencies,
    };
  } catch (error) {
    // Re-throw custom errors as-is
    if (error instanceof GroupAccessError) {
      throw error;
    }
    // Convert member operation errors to access errors
    if (error instanceof Error && error.name === "MemberOperationError") {
      throw new GroupAccessError();
    }
    // Wrap unexpected errors
    throw new GroupDataError("get group currencies", error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Gets detailed information about a specific group including members, currencies and invitations
 *
 * This function performs the following operations:
 * 1. Fetches group details
 * 2. Fetches all active members with their profile information
 * 3. Fetches all currencies available in the group
 * 4. Fetches pending invitations
 * 5. Returns complete GroupDetailDTO
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group to fetch
 * @param userId - ID of the requesting user (for role determination)
 * @returns Detailed group information
 * @throws {Error} If group not found or user is not a member
 */
export async function getGroupDetails(
  supabase: SupabaseClient<Database>,
  groupId: string,
  userId: string
): Promise<GroupDetailDTO> {
  // Input validation
  if (!groupId) {
    throw new GroupDataError("get group details", "Group ID is required");
  }
  if (!userId) {
    throw new GroupDataError("get group details", "User ID is required");
  }

  try {
    // Verify user membership
    const isMember = await verifyGroupMembership(supabase, groupId, userId);
    if (!isMember) {
      throw new GroupAccessError();
    }

    // Fetch group with user's membership and role
    const { data: groupData, error: groupError } = await supabase
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
      throw new GroupAccessError();
    }

    // Extract user's role
    const userMembership = groupData.group_members as unknown as {
      role: GroupRole;
      status: "active" | "inactive";
      joined_at: string;
    }[];
    const myRole = userMembership[0]?.role || "member";

    // Fetch all active members with profiles using member service
    const members = await getGroupMemberDetails(supabase, groupId);

    // Fetch group currencies
    const { data: currenciesData, error: currenciesError } = await supabase
      .from("group_currencies")
      .select("currency_code, exchange_rate, currencies(name)")
      .eq("group_id", groupId)
      .order("currency_code");

    if (currenciesError) {
      throw new GroupDataError("get group details", "Failed to fetch currencies");
    }

    // Transform currencies data
    const groupCurrencies: GroupCurrencyDTO[] = (currenciesData || []).map((gc) => {
      const currency = gc.currencies as unknown as { name: string };
      return {
        code: gc.currency_code,
        name: currency.name,
        exchange_rate: gc.exchange_rate,
      };
    });

    // Separate base currency from additional currencies
    const baseCurrency = groupCurrencies.find((gc) => gc.code === groupData.base_currency_code);
    const additional_currencies = groupCurrencies.filter((gc) => gc.code !== groupData.base_currency_code);

    // Fetch pending invitations
    const { data: invitationsData, error: invitationsError } = await supabase
      .from("invitations")
      .select("id, email, status, created_at")
      .eq("group_id", groupId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Note: invitations errors are not thrown as invitations are optional
    const pendingInvitations: PendingInvitationDTO[] = (invitationsData || []).map((inv) => ({
      id: inv.id,
      email: inv.email,
      status: inv.status,
      created_at: inv.created_at,
    }));

    // Combine all currencies into a flat array for backwards compatibility
    const allCurrencies = [baseCurrency, ...additional_currencies].filter(Boolean) as GroupCurrencyDTO[];

    // Return complete group details
    return {
      id: groupData.id,
      name: groupData.name,
      base_currency_code: groupData.base_currency_code,
      status: groupData.status,
      created_at: groupData.created_at,
      my_role: myRole,
      members,
      group_currencies: allCurrencies,
      pending_invitations: pendingInvitations,
    };
  } catch (error) {
    // Re-throw custom errors as-is
    if (error instanceof GroupAccessError) {
      throw error;
    }
    // Convert member operation errors to access errors
    if (error instanceof Error && error.name === "MemberOperationError") {
      throw new GroupAccessError();
    }
    // Wrap unexpected errors
    throw new GroupDataError("get group details", error instanceof Error ? error.message : "Unknown error");
  }
}
