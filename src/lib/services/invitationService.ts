/**
 * Invitation service - handles business logic for invitation operations
 * Supports both existing user invitations and new user invitations
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  Invitation,
  InvitationDTO,
  InvitationStatus,
  AcceptInvitationResponseDTO,
  DeclineInvitationResponseDTO,
} from "../../types";

/**
 * Custom errors for invitation operations
 */
export class InvitationOperationError extends Error {
  constructor(operation: string, details?: string) {
    super(`Invitation operation failed during ${operation}${details ? `: ${details}` : ""}`);
    this.name = "InvitationOperationError";
  }
}

export class InvitationNotFoundError extends InvitationOperationError {
  constructor(invitationId: string) {
    super("find invitation", `Invitation ${invitationId} not found`);
    this.name = "InvitationNotFoundError";
  }
}

export class InvitationAccessError extends InvitationOperationError {
  constructor(invitationId: string, userId: string) {
    super("access invitation", `User ${userId} does not have access to invitation ${invitationId}`);
    this.name = "InvitationAccessError";
  }
}

export class InvitationAlreadyProcessedError extends InvitationOperationError {
  constructor(invitationId: string, status: InvitationStatus) {
    super("process invitation", `Invitation ${invitationId} already has status ${status}`);
    this.name = "InvitationAlreadyProcessedError";
  }
}

/**
 * Creates an invitation for an existing user
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group to invite to
 * @param email - Email address of the existing user
 * @param inviteeProfileId - Profile ID of the existing user
 * @returns Created invitation record
 * @throws {InvitationOperationError} If invitation creation fails
 */
export async function createInvitationForExistingUser(
  supabase: SupabaseClient,
  groupId: string,
  email: string,
  inviteeProfileId: string
): Promise<Invitation> {
  // Normalize email for consistency
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user is already a member of the group
  const { data: existingMember, error: memberError } = await supabase
    .from("group_members")
    .select("profile_id")
    .eq("group_id", groupId)
    .eq("profile_id", inviteeProfileId)
    .eq("status", "active")
    .single();

  if (memberError && memberError.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw new InvitationOperationError("check membership", memberError.message);
  }

  if (existingMember) {
    throw new InvitationOperationError("create invitation", "User is already a member of this group");
  }

  // Check if there's already a pending invitation
  const { data: existingInvitation, error: invitationError } = await supabase
    .from("invitations")
    .select("id, status")
    .eq("group_id", groupId)
    .eq("invitee_profile_id", inviteeProfileId)
    .eq("status", "pending")
    .single();

  if (invitationError && invitationError.code !== "PGRST116") {
    throw new InvitationOperationError("check existing invitation", invitationError.message);
  }

  if (existingInvitation) {
    throw new InvitationOperationError("create invitation", "Pending invitation already exists for this user");
  }

  // Create the invitation using RLS policy (group members can create invitations)
  const { data: invitation, error: createError } = await supabase
    .from("invitations")
    .insert({
      group_id: groupId,
      email: normalizedEmail,
      invitee_profile_id: inviteeProfileId,
      status: "pending",
    })
    .select()
    .single();

  if (createError) {
    throw new InvitationOperationError("create invitation", createError.message);
  }

  return invitation;
}

/**
 * Creates an invitation for a new user (who doesn't have an account yet)
 *
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group to invite to
 * @param email - Email address to invite
 * @returns Created invitation record
 * @throws {InvitationOperationError} If invitation creation fails
 */
export async function createInvitationForNewUser(
  supabase: SupabaseClient,
  groupId: string,
  email: string
): Promise<Invitation> {
  // Normalize email for consistency
  const normalizedEmail = email.toLowerCase().trim();

  // Check if there's already a pending invitation for this email to this group
  const { data: existingInvitation, error: invitationError } = await supabase
    .from("invitations")
    .select("id, status")
    .eq("group_id", groupId)
    .eq("email", normalizedEmail)
    .is("invitee_profile_id", null)
    .eq("status", "pending")
    .single();

  if (invitationError && invitationError.code !== "PGRST116") {
    throw new InvitationOperationError("check existing invitation", invitationError.message);
  }

  if (existingInvitation) {
    throw new InvitationOperationError("create invitation", "Pending invitation already exists for this email");
  }

  // Create the invitation using RLS policy (group members can create invitations)
  const { data: invitation, error: createError } = await supabase
    .from("invitations")
    .insert({
      group_id: groupId,
      email: normalizedEmail,
      status: "pending",
    })
    .select()
    .single();

  if (createError) {
    throw new InvitationOperationError("create invitation", createError.message);
  }

  return invitation;
}

/**
 * Gets all invitations for a user (combines both existing user and new user invitations)
 *
 * @param supabase - Supabase client instance
 * @param userId - Profile ID of the authenticated user
 * @param userEmail - Email address of the authenticated user
 * @returns Array of invitation DTOs with group information
 * @throws {InvitationOperationError} If fetching fails
 */
export async function getUserInvitations(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string
): Promise<InvitationDTO[]> {
  // Normalize email for consistent querying
  const normalizedEmail = userEmail.toLowerCase().trim();

  const { data: invitations, error } = await supabase
    .from("invitations")
    .select(
      `
      id,
      email,
      status,
      created_at,
      invitee_profile_id,
      groups:group_id (
        id,
        name
      )
    `
    )
    .eq("status", "pending")
    .or(`invitee_profile_id.eq.${userId},and(email.eq.${normalizedEmail},invitee_profile_id.is.null)`);

  if (error) {
    throw new InvitationOperationError("fetch invitations", error.message);
  }

  // Transform to DTO format
  return invitations.map((invitation) => ({
    id: invitation.id,
    email: invitation.email,
    status: invitation.status,
    created_at: invitation.created_at,
    invitee_profile_id: invitation.invitee_profile_id,
    group: invitation.groups,
  }));
}

/**
 * Accepts an invitation and adds the user to the group
 *
 * @param supabase - Supabase client instance
 * @param invitationId - ID of the invitation to accept
 * @param userId - Profile ID of the user accepting the invitation
 * @returns Response with invitation and group details
 * @throws {InvitationNotFoundError} If invitation doesn't exist
 * @throws {InvitationAccessError} If user doesn't have access to the invitation
 * @throws {InvitationAlreadyProcessedError} If invitation is not pending
 * @throws {InvitationOperationError} If acceptance fails
 */
export async function acceptInvitation(
  supabase: SupabaseClient,
  invitationId: string,
  userId: string
): Promise<AcceptInvitationResponseDTO> {
  // First, get the invitation with group details
  const { data: invitation, error: fetchError } = await supabase
    .from("invitations")
    .select(
      `
      id,
      email,
      status,
      invitee_profile_id,
      group_id,
      groups:group_id (
        id,
        name
      )
    `
    )
    .eq("id", invitationId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      throw new InvitationNotFoundError(invitationId);
    }
    throw new InvitationOperationError("fetch invitation", fetchError.message);
  }

  // Check if invitation belongs to the user (case-insensitive email comparison)
  const isExistingUserInvitation = invitation.invitee_profile_id === userId;
  const userEmail = (await getUserEmail(supabase, userId)).toLowerCase().trim();
  const invitationEmail = invitation.email.toLowerCase().trim();
  const isNewUserInvitation = invitation.invitee_profile_id === null && invitationEmail === userEmail;

  if (!isExistingUserInvitation && !isNewUserInvitation) {
    throw new InvitationAccessError(invitationId, userId);
  }

  // Check if invitation is still pending
  if (invitation.status !== "pending") {
    throw new InvitationAlreadyProcessedError(invitationId, invitation.status);
  }

  // Check if user is already a member
  const { data: existingMember, error: memberError } = await supabase
    .from("group_members")
    .select("profile_id")
    .eq("group_id", invitation.group_id)
    .eq("profile_id", userId)
    .eq("status", "active")
    .single();

  if (memberError && memberError.code !== "PGRST116") {
    throw new InvitationOperationError("check membership", memberError.message);
  }

  if (existingMember) {
    // User is already a member, just update invitation status
    const { error: updateError } = await supabase
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId);

    if (updateError) {
      throw new InvitationOperationError("update invitation", updateError.message);
    }

    return {
      message: "Invitation accepted successfully",
      invitation_id: invitationId,
      group_id: invitation.group_id,
      group_name: invitation.groups.name,
    };
  }

  // Start transaction: add user to group and update invitation
  const { error: transactionError } = await supabase.rpc("accept_invitation_transaction", {
    p_invitation_id: invitationId,
    p_user_id: userId,
  });

  if (transactionError) {
    throw new InvitationOperationError("accept invitation transaction", transactionError.message);
  }

  return {
    message: "Invitation accepted successfully. You have been added to the group.",
    invitation_id: invitationId,
    group_id: invitation.group_id,
    group_name: invitation.groups.name,
  };
}

/**
 * Declines an invitation
 *
 * @param supabase - Supabase client instance
 * @param invitationId - ID of the invitation to decline
 * @param userId - Profile ID of the user declining the invitation
 * @returns Response with invitation details
 * @throws {InvitationNotFoundError} If invitation doesn't exist
 * @throws {InvitationAccessError} If user doesn't have access to the invitation
 * @throws {InvitationAlreadyProcessedError} If invitation is not pending
 * @throws {InvitationOperationError} If declining fails
 */
export async function declineInvitation(
  supabase: SupabaseClient,
  invitationId: string,
  userId: string
): Promise<DeclineInvitationResponseDTO> {
  // First, get the invitation
  const { data: invitation, error: fetchError } = await supabase
    .from("invitations")
    .select("id, email, status, invitee_profile_id")
    .eq("id", invitationId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      throw new InvitationNotFoundError(invitationId);
    }
    throw new InvitationOperationError("fetch invitation", fetchError.message);
  }

  // Check if invitation belongs to the user (case-insensitive email comparison)
  const userEmail = (await getUserEmail(supabase, userId)).toLowerCase().trim();
  const invitationEmail = invitation.email.toLowerCase().trim();
  const isExistingUserInvitation = invitation.invitee_profile_id === userId;
  const isNewUserInvitation = invitation.invitee_profile_id === null && invitationEmail === userEmail;

  if (!isExistingUserInvitation && !isNewUserInvitation) {
    throw new InvitationAccessError(invitationId, userId);
  }

  // Check if invitation is still pending
  if (invitation.status !== "pending") {
    throw new InvitationAlreadyProcessedError(invitationId, invitation.status);
  }

  // Update invitation status
  const { error: updateError } = await supabase
    .from("invitations")
    .update({ status: "declined" })
    .eq("id", invitationId);

  if (updateError) {
    throw new InvitationOperationError("decline invitation", updateError.message);
  }

  return {
    message: "Invitation declined successfully",
    invitation_id: invitationId,
  };
}

/**
 * Helper function to get user's email from their profile
 */
async function getUserEmail(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data: profile, error } = await supabase.from("profiles").select("email").eq("id", userId).single();

  if (error) {
    throw new InvitationOperationError("get user email", error.message);
  }

  return profile.email;
}

/**
 * Checks if a user exists in the system by email
 *
 * @param supabase - Supabase client instance
 * @param email - Email address to check
 * @returns Profile ID if user exists, null otherwise
 */
export async function findUserByEmail(supabase: SupabaseClient, email: string): Promise<string | null> {
  // Normalize email for consistent user lookup
  const normalizedEmail = email.toLowerCase().trim();

  // Use RPC function that bypasses RLS to find user by email
  const { data: userId, error } = await supabase.rpc("find_user_by_email_safe", {
    email_to_find: normalizedEmail,
  });

  if (error) {
    throw new InvitationOperationError("find user by email", error.message);
  }

  if (userId) {
    return userId;
  } else {
    return null;
  }
}
