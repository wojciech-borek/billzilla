/**
 * Group service - handles business logic for group operations
 * Refactored to use Specification Pattern, Builder Pattern, Repository Pattern, and Unit of Work
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { calculateUserBalances } from "./balanceService";
import { fetchGroupMembers, getGroupMemberDetails } from "./memberService";
import type {
  CreateGroupCommand,
  CreateGroupResponseDTO,
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

// Import refactored components
import { GroupRepository } from "./repositories/GroupRepository";
import { GroupBuilderFactory } from "./builders/GroupBuilder";
import { GroupCreationUnitOfWork } from "./units/GroupCreationUnitOfWork";
import { UserIsActiveGroupMemberSpecification, CurrencyConfiguredForGroupSpecification } from "./specifications/groupSpecifications";
import { CurrencyNotFoundError, TransactionError, GroupAccessError, GroupDataError } from "./errors/groupErrors";

// Re-export error classes for backward compatibility
export { CurrencyNotFoundError, TransactionError, GroupAccessError, GroupDataError };

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
  // Use Unit of Work pattern for atomic group creation
  const unitOfWork = new GroupCreationUnitOfWork(supabase, command, userId);
  return await unitOfWork.execute();
}

/**
 * Composes the final GroupListItemDTO array using Builder pattern
 */
function composeGroupListItems(
  userGroups: any[],
  balancesByGroup: Map<string, number>,
  membersByGroup: Map<string, GroupMemberSummaryDTO[]>,
  supabase: SupabaseClient<Database>
): GroupListItemDTO[] {
  const builder = GroupBuilderFactory.forGroupList(supabase);

  return userGroups.map((group) => {
    // Extract role from group_members relation
    const groupMembersData = group.group_members as unknown as { role: GroupRole }[];
    const role = groupMembersData[0]?.role || "member";

    return builder
      .reset()
      .withGroupData(group)
      .withUserRole(role)
      .withUserBalance(balancesByGroup.get(group.id) || 0)
      .withMembers(membersByGroup.get(group.id) || [])
      .buildGroupListItem();
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

  const repository = new GroupRepository(supabase);

  try {
    // Fetch user groups with roles using repository
    const userGroups = await repository.fetchUserGroupsWithRoles(userId, status, limit, offset);

    // Get total count for pagination using repository
    const total = await repository.countUserGroups(userId, status);

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

    // Compose final response using Builder pattern
    const groupListItems = composeGroupListItems(userGroups, balancesByGroup, membersByGroup, supabase);

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
 * 1. Verifies user is a member of the group using Specification pattern
 * 2. Fetches all currencies available in the group using Repository pattern
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

  const repository = new GroupRepository(supabase);

  try {
    // Verify user is a member of the group using Specification pattern
    const membershipSpec = new UserIsActiveGroupMemberSpecification(supabase);
    const isMember = await membershipSpec.isSatisfiedBy({ groupId, userId });
    if (!isMember) {
      throw new GroupAccessError();
    }

    // Get group basic info using repository
    const group = await repository.fetchGroupBasic(groupId);

    // Fetch all currencies for the group using repository
    const currenciesData = await repository.fetchGroupCurrencies(groupId);

    // Transform currencies data
    const groupCurrencies: GroupCurrencyDTO[] = currenciesData.map((gc) => {
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
 * 1. Fetches group details using Repository pattern
 * 2. Fetches all active members with their profile information
 * 3. Fetches all currencies available in the group
 * 4. Fetches pending invitations
 * 5. Builds complete GroupDetailDTO using Builder pattern
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

  const repository = new GroupRepository(supabase);
  const builder = GroupBuilderFactory.forGroupDetail(supabase);

  try {
    // Verify user membership using Specification pattern
    const membershipSpec = new UserIsActiveGroupMemberSpecification(supabase);
    const isMember = await membershipSpec.isSatisfiedBy({ groupId, userId });
    if (!isMember) {
      throw new GroupAccessError();
    }

    // Fetch group with user's membership and role using repository
    const groupData = await repository.fetchGroupWithMembership(groupId, userId);

    // Extract user's role using repository helper
    const myRole = repository.extractUserRole(groupData);

    // Fetch all active members with profiles using member service
    const members = await getGroupMemberDetails(supabase, groupId);

    // Fetch group currencies using repository
    const currenciesData = await repository.fetchGroupCurrencies(groupId);

    // Transform currencies data
    const groupCurrencies: GroupCurrencyDTO[] = currenciesData.map((gc) => {
      const currency = gc.currencies as unknown as { name: string };
      return {
        code: gc.currency_code,
        name: currency.name,
        exchange_rate: gc.exchange_rate,
      };
    });

    // Fetch pending invitations using repository
    const invitationsData = await repository.fetchPendingInvitations(groupId);
    const pendingInvitations: PendingInvitationDTO[] = invitationsData.map((inv) => ({
      id: inv.id,
      email: inv.email,
      status: inv.status,
      created_at: inv.created_at,
    }));

    // Build final DTO using Builder pattern
    return builder
      .withGroupData(groupData)
      .withUserRole(myRole)
      .withMembers(members)
      .withCurrencies(groupCurrencies)
      .withInvitations(pendingInvitations)
      .buildGroupDetail();
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
