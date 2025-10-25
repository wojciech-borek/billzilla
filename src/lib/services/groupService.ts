/**
 * Group service - handles business logic for group operations
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
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
  // Step 1: Validate that base currency exists
  const { data: currency, error: currencyError } = await supabase
    .from("currencies")
    .select("code")
    .eq("code", command.base_currency_code)
    .single();

  if (currencyError || !currency) {
    throw new CurrencyNotFoundError(command.base_currency_code);
  }

  // Step 2-5: Create group atomically using RPC function
  // This function runs as SECURITY DEFINER (bypasses RLS) and handles invitations atomically

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
    added_members: Array.isArray(newGroup.added_members) ? newGroup.added_members.map((member: any) => ({
      profile_id: member.profile_id,
      email: member.email,
      full_name: member.full_name,
      status: member.status,
    })) : [],
    created_invitations: Array.isArray(newGroup.created_invitations) ? newGroup.created_invitations.map((inv: any) => ({
      id: inv.id,
      email: inv.email,
      status: inv.status,
    })) : [],
  };

  // Return the complete response
  return {
    ...newGroup,
    role: "creator" as GroupRole,
    invitations: invitationResults,
  };
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
  const { status = "active", limit = 50, offset = 0 } = options;

  // Step A: Fetch groups where user is a member with their role
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
    throw new Error("Failed to fetch groups");
  }

  // Get total count for pagination
  const { count: totalCount, error: countError } = await supabase
    .from("groups")
    .select("id, group_members!inner(profile_id)", { count: "exact", head: true })
    .eq("group_members.profile_id", userId)
    .eq("status", status);

  if (countError) {
    throw new Error("Failed to count groups");
  }

  const total = totalCount || 0;

  // If no groups, return empty result
  if (!userGroups || userGroups.length === 0) {
    return {
      data: [],
      total,
      limit,
      offset,
    };
  }

  const groupIds = userGroups.map((g) => g.id);

  // Step B: Fetch all active members for these groups
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
    throw new Error("Failed to fetch group members");
  }

  // Organize members by group
  const membersByGroup = new Map<string, GroupMemberSummaryDTO[]>();

  for (const member of groupMembers || []) {
    const groupId = member.group_id;
    const profile = member.profiles as unknown as { id: string; full_name: string | null; avatar_url: string | null };

    if (!membersByGroup.has(groupId)) {
      membersByGroup.set(groupId, []);
    }

    membersByGroup.get(groupId)!.push({
      profile_id: member.profile_id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      status: member.status,
      role: member.role,
    });
  }

  // Step C: Calculate user's balance for each group
  // C1: Fetch expenses paid by user
  const { data: userExpenses, error: expensesError } = await supabase
    .from("expenses")
    .select("group_id, amount, currency_code")
    .in("group_id", groupIds)
    .eq("created_by", userId);

  if (expensesError) {
    throw new Error("Failed to fetch user expenses");
  }

  // C2: Fetch expense splits for user
  const { data: userSplits, error: splitsError } = await supabase
    .from("expense_splits")
    .select(
      `
      amount,
      expenses!inner(
        group_id,
        currency_code
      )
    `
    )
    .eq("profile_id", userId)
    .in("expenses.group_id", groupIds);

  if (splitsError) {
    throw new Error("Failed to fetch user splits");
  }

  // C3: Fetch settlements involving user
  const { data: settlements, error: settlementsError } = await supabase
    .from("settlements")
    .select("group_id, amount, payer_id, payee_id")
    .in("group_id", groupIds)
    .or(`payer_id.eq.${userId},payee_id.eq.${userId}`);

  if (settlementsError) {
    throw new Error("Failed to fetch settlements");
  }

  // C4: Fetch exchange rates for all group currencies
  const { data: groupCurrencies, error: currenciesError } = await supabase
    .from("group_currencies")
    .select("group_id, currency_code, exchange_rate")
    .in("group_id", groupIds);

  if (currenciesError) {
    throw new Error("Failed to fetch group currencies");
  }

  // Build exchange rate lookup: groupId -> currencyCode -> exchangeRate
  const exchangeRates = new Map<string, Map<string, number>>();
  for (const gc of groupCurrencies || []) {
    if (!exchangeRates.has(gc.group_id)) {
      exchangeRates.set(gc.group_id, new Map());
    }
    exchangeRates.get(gc.group_id)!.set(gc.currency_code, gc.exchange_rate);
  }

  // Calculate balances per group
  const balancesByGroup = new Map<string, number>();

  // Initialize all groups with 0 balance
  for (const groupId of groupIds) {
    balancesByGroup.set(groupId, 0);
  }

  // Add amounts paid by user (converted to base currency)
  for (const expense of userExpenses || []) {
    const rate = exchangeRates.get(expense.group_id)?.get(expense.currency_code) || 1.0;
    const amountInBase = expense.amount * rate;
    balancesByGroup.set(expense.group_id, balancesByGroup.get(expense.group_id)! + amountInBase);
  }

  // Subtract amounts owed by user (converted to base currency)
  for (const split of userSplits || []) {
    const expenseData = split.expenses as unknown as { group_id: string; currency_code: string };
    const rate = exchangeRates.get(expenseData.group_id)?.get(expenseData.currency_code) || 1.0;
    const amountInBase = split.amount * rate;
    balancesByGroup.set(expenseData.group_id, balancesByGroup.get(expenseData.group_id)! - amountInBase);
  }

  // Add settlements received by user
  for (const settlement of settlements || []) {
    if (settlement.payee_id === userId) {
      balancesByGroup.set(settlement.group_id, balancesByGroup.get(settlement.group_id)! + settlement.amount);
    }
  }

  // Subtract settlements paid by user
  for (const settlement of settlements || []) {
    if (settlement.payer_id === userId) {
      balancesByGroup.set(settlement.group_id, balancesByGroup.get(settlement.group_id)! - settlement.amount);
    }
  }

  // Step D: Compose GroupListItemDTO array
  const groupListItems: GroupListItemDTO[] = userGroups.map((group) => {
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

  return {
    data: groupListItems,
    total,
    limit,
    offset,
  };
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
  // Step 1: Verify user is a member of the group
  const { data: membership, error: membershipError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("profile_id", userId)
    .eq("status", "active")
    .single();

  if (membershipError || !membership) {
    throw new Error("Group not found or you are not a member");
  }

  // Step 2: Get group base currency
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("base_currency_code")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("Group not found");
  }

  // Step 3: Fetch all currencies for the group
  const { data: currenciesData, error: currenciesError } = await supabase
    .from("group_currencies")
    .select("currency_code, exchange_rate, currencies(name)")
    .eq("group_id", groupId)
    .order("currency_code");

  if (currenciesError) {
    throw new Error("Failed to fetch group currencies");
  }

  // Step 4: Transform currencies data
  const groupCurrencies: GroupCurrencyDTO[] = (currenciesData || []).map((gc) => {
    const currency = gc.currencies as unknown as { name: string };
    return {
      code: gc.currency_code,
      name: currency.name,
      exchange_rate: gc.exchange_rate,
    };
  });

  // Step 5: Separate base currency from additional currencies
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
  // Step 1: Fetch group with user's membership and role
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
    throw new Error("Group not found or you are not a member");
  }

  // Extract user's role
  const userMembership = groupData.group_members as unknown as {
    role: GroupRole;
    status: "active" | "inactive";
    joined_at: string;
  }[];
  const myRole = userMembership[0]?.role || "member";

  // Step 2: Fetch all active members with profiles
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
    throw new Error("Failed to fetch group members");
  }

  // Transform members data
  const members: GroupDetailDTO["members"] = (membersData || []).map((member) => {
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

  // Step 3: Fetch group currencies
  const { data: currenciesData, error: currenciesError } = await supabase
    .from("group_currencies")
    .select("currency_code, exchange_rate, currencies(name)")
    .eq("group_id", groupId)
    .order("currency_code");

  if (currenciesError) {
    throw new Error("Failed to fetch group currencies");
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

  // Step 4: Fetch pending invitations
  const { data: invitationsData, error: invitationsError } = await supabase
    .from("invitations")
    .select("id, email, status, created_at")
    .eq("group_id", groupId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (invitationsError) {
    // Don't throw - invitations are optional
  }

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
}
