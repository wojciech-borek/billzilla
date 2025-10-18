/**
 * Group service - handles business logic for group operations
 */

import type { 
  CreateGroupCommand, 
  CreateGroupResponseDTO,
  InvitationResultDTO,
  GroupRole
} from '../../types';
import type { Database } from '../../db/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Custom error for currency not found
 */
export class CurrencyNotFoundError extends Error {
  constructor(currencyCode: string) {
    super(`Currency with code '${currencyCode}' does not exist`);
    this.name = 'CurrencyNotFoundError';
  }
}

/**
 * Custom error for transaction failures
 */
export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * Handles invitation processing for a group
 * This function operates in "best-effort" mode - failures don't rollback group creation
 * 
 * @param supabase - Supabase client instance
 * @param groupId - ID of the group to invite members to
 * @param emails - Array of email addresses to process
 * @returns Results of invitation processing (added members and created invitations)
 */
async function handleInvitations(
  supabase: SupabaseClientType,
  groupId: string,
  emails: string[]
): Promise<InvitationResultDTO> {
  const result: InvitationResultDTO = {
    added_members: [],
    created_invitations: []
  };

  if (!emails || emails.length === 0) {
    return result;
  }

  try {
    // Step 1: Find existing users by email
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('email', emails);

    if (profilesError) {
      console.error('Error fetching profiles for invitations:', profilesError);
      return result;
    }

    // Step 2: Add existing users to the group
    if (existingProfiles && existingProfiles.length > 0) {
      const membersToAdd = existingProfiles.map(profile => ({
        group_id: groupId,
        profile_id: profile.id,
        role: 'member' as GroupRole,
        status: 'active' as const
      }));

      const { data: addedMembers, error: membersError } = await supabase
        .from('group_members')
        .insert(membersToAdd)
        .select('profile_id, status')
        .returns<Array<{ profile_id: string; status: 'active' | 'inactive' }>>();

      if (!membersError && addedMembers) {
        // Map the added members with their profile information
        result.added_members = addedMembers.map(member => {
          const profile = existingProfiles.find(p => p.id === member.profile_id);
          return {
            profile_id: member.profile_id,
            email: profile?.email || '',
            full_name: profile?.full_name || null,
            status: member.status
          };
        });
      } else if (membersError) {
        console.error('Error adding members to group:', membersError);
      }
    }

    // Step 3: Find emails without accounts
    const existingEmails = new Set(existingProfiles?.map(p => p.email) || []);
    const emailsWithoutAccounts = emails.filter(email => !existingEmails.has(email));

    // Step 4: Create invitations for emails without accounts
    if (emailsWithoutAccounts.length > 0) {
      const invitationsToCreate = emailsWithoutAccounts.map(email => ({
        group_id: groupId,
        email: email,
        status: 'pending' as const
      }));

      const { data: createdInvitations, error: invitationsError } = await supabase
        .from('invitations')
        .insert(invitationsToCreate)
        .select('id, email, status')
        .returns<Array<{ id: string; email: string; status: 'pending' | 'accepted' | 'declined' }>>();

      if (!invitationsError && createdInvitations) {
        result.created_invitations = createdInvitations.map(inv => ({
          id: inv.id,
          email: inv.email,
          status: inv.status
        }));
      } else if (invitationsError) {
        console.error('Error creating invitations:', invitationsError);
      }
    }
  } catch (error) {
    console.error('Unexpected error in handleInvitations:', error);
  }

  return result;
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
  supabase: SupabaseClientType,
  command: CreateGroupCommand,
  userId: string
): Promise<CreateGroupResponseDTO> {
  // Step 1: Validate that base currency exists
  const { data: currency, error: currencyError } = await supabase
    .from('currencies')
    .select('code')
    .eq('code', command.base_currency_code)
    .single();

  if (currencyError || !currency) {
    throw new CurrencyNotFoundError(command.base_currency_code);
  }

  // Step 2-4: Create group, add creator as member, add base currency (transaction)
  // We'll use Promise.all to execute these operations, but they need to be done carefully
  // to ensure data consistency. In a production environment, you might want to use
  // a database transaction or a stored procedure.

  // Create the group
  const { data: newGroup, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: command.name,
      base_currency_code: command.base_currency_code,
      status: 'active'
    })
    .select()
    .single();

  if (groupError || !newGroup) {
    throw new TransactionError(`Failed to create group: ${groupError?.message || 'Unknown error'}`);
  }

  try {
    // Add creator as member and base currency in parallel
    const [memberResult, currencyResult] = await Promise.all([
      // Add creator as member
      supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          profile_id: userId,
          role: 'creator',
          status: 'active'
        })
        .select()
        .single(),
      
      // Add base currency
      supabase
        .from('group_currencies')
        .insert({
          group_id: newGroup.id,
          currency_code: command.base_currency_code,
          exchange_rate: 1.0
        })
        .select()
        .single()
    ]);

    if (memberResult.error) {
      // Rollback: delete the group
      await supabase.from('groups').delete().eq('id', newGroup.id);
      throw new TransactionError(`Failed to add creator as member: ${memberResult.error.message}`);
    }

    if (currencyResult.error) {
      // Rollback: delete the group and member
      await Promise.all([
        supabase.from('group_members').delete().eq('group_id', newGroup.id),
        supabase.from('groups').delete().eq('id', newGroup.id)
      ]);
      throw new TransactionError(`Failed to add base currency: ${currencyResult.error.message}`);
    }
  } catch (error) {
    // If it's already a TransactionError, re-throw it
    if (error instanceof TransactionError) {
      throw error;
    }
    // Otherwise, wrap it
    throw new TransactionError(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Step 5: Handle invitations (best-effort, non-blocking)
  let invitationResults: InvitationResultDTO = {
    added_members: [],
    created_invitations: []
  };

  if (command.invite_emails && command.invite_emails.length > 0) {
    invitationResults = await handleInvitations(
      supabase,
      newGroup.id,
      command.invite_emails
    );
  }

  // Return the complete response
  return {
    ...newGroup,
    role: 'creator' as GroupRole,
    invitations: invitationResults
  };
}

