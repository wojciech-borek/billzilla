import type { SupabaseClient } from "../../../db/supabase.client";
import type { CreateGroupCommand, CreateGroupResponseDTO, InvitationResultDTO } from "../../../types";
import { GroupRepository } from "../repositories/GroupRepository";
import { GroupBuilderFactory } from "../builders/GroupBuilder";
import { CurrencyNotFoundError, TransactionError, GroupDataError } from "../errors/groupErrors";
import { GroupCreationValidSpecification } from "../specifications/groupSpecifications";

// Type definitions for group creation data
interface CreatedGroupData {
  id: string;
  name: string;
  base_currency_code: string;
  added_members?: {
    profile_id: string;
    email: string;
    full_name: string | null;
    status: string;
  }[];
  created_invitations?: {
    id: string;
    email: string;
    status: string;
  }[];
}

/**
 * Unit of Work pattern for group creation operations
 * Manages the complete group creation transaction atomically
 */
export class GroupCreationUnitOfWork {
  private repository: GroupRepository;
  private builder = GroupBuilderFactory.forGroupCreation(this.supabase);
  private createdGroupId: string | null = null;

  constructor(
    private supabase: SupabaseClient,
    private command: CreateGroupCommand,
    private userId: string
  ) {
    this.repository = new GroupRepository(supabase);
  }

  /**
   * Execute the complete group creation workflow
   */
  async execute(): Promise<CreateGroupResponseDTO> {
    try {
      // Validate input data
      await this.validateInput();

      // Create group atomically with all related data
      const groupData = await this.createGroup();

      // Parse invitation results
      const invitationResults = this.parseInvitationResults(groupData);

      // Build response DTO
      return this.buildResponse(groupData, invitationResults);
    } catch (error) {
      // Rollback if needed (though RPC handles most of this)
      await this.rollback();
      throw error;
    }
  }

  /**
   * Validate the input command using specifications
   */
  private async validateInput(): Promise<void> {
    // Input validation
    if (!this.userId) {
      throw new GroupDataError("create group", "User ID is required");
    }

    // Use specification pattern for business rule validation
    const spec = new GroupCreationValidSpecification(this.supabase);
    const isValid = await spec.isSatisfiedBy({
      name: this.command.name,
      base_currency_code: this.command.base_currency_code,
    });

    if (!isValid) {
      throw new GroupDataError("create group", "Invalid group creation parameters");
    }
  }

  /**
   * Create the group using the repository
   */
  private async createGroup(): Promise<CreatedGroupData> {
    try {
      const groupData = await this.repository.createGroupAtomically({
        groupName: this.command.name,
        baseCurrencyCode: this.command.base_currency_code,
        creatorId: this.userId,
        inviteEmails: this.command.invite_emails,
      });

      this.createdGroupId = groupData.id;
      return groupData;
    } catch (error) {
      if (error instanceof Error && error.message.includes("does not exist")) {
        throw new CurrencyNotFoundError(this.command.base_currency_code);
      }
      throw new TransactionError(`Failed to create group: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Parse invitation results from the database response
   */
  private parseInvitationResults(groupData: CreatedGroupData): InvitationResultDTO {
    return {
      added_members: Array.isArray(groupData.added_members)
        ? groupData.added_members.map((member) => ({
            profile_id: member.profile_id,
            email: member.email,
            full_name: member.full_name,
            status: member.status,
          }))
        : [],
      created_invitations: Array.isArray(groupData.created_invitations)
        ? groupData.created_invitations.map((inv) => ({
            id: inv.id,
            email: inv.email,
            status: inv.status,
          }))
        : [],
    };
  }

  /**
   * Build the final response DTO
   */
  private buildResponse(groupData: CreatedGroupData, invitationResults: InvitationResultDTO): CreateGroupResponseDTO {
    // Remove database-specific fields and return clean response
    const { added_members, created_invitations, ...cleanGroupData } = groupData;

    return this.builder
      .withGroupData(cleanGroupData)
      .withUserRole("creator")
      .buildCreateGroupResponse(invitationResults);
  }

  /**
   * Rollback the operation if something went wrong
   * Note: The RPC function handles most rollback, but we can add cleanup here if needed
   */
  private async rollback(): Promise<void> {
    // The RPC function handles atomic operations, but we could add additional cleanup here
    // For now, the database constraints and RPC handle the rollback
  }
}
