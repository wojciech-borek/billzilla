import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import type {
  CreateGroupResponseDTO,
  GroupListItemDTO,
  GroupDetailDTO,
  GroupMemberSummaryDTO,
  GroupCurrencyDTO,
  PendingInvitationDTO,
  GroupRole,
  InvitationResultDTO,
} from "../../../types";

/**
 * Builder pattern for constructing group-related DTOs
 * Allows gradual construction of complex group objects with related data
 */
type GroupData = Database["public"]["Tables"]["groups"]["Row"];

export class GroupBuilder {
  private supabase: SupabaseClient<Database>;
  private groupData: GroupData | null = null;
  private members: GroupMemberSummaryDTO[] = [];
  private currencies: GroupCurrencyDTO[] = [];
  private invitations: PendingInvitationDTO[] = [];
  private userRole: GroupRole = "member";
  private userBalance = 0;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Set the base group data
   */
  withGroupData(groupData: GroupData): GroupBuilder {
    this.groupData = groupData;
    return this;
  }

  /**
   * Set the user's role in the group
   */
  withUserRole(role: GroupRole): GroupBuilder {
    this.userRole = role;
    return this;
  }

  /**
   * Set the user's balance in the group
   */
  withUserBalance(balance: number): GroupBuilder {
    this.userBalance = balance;
    return this;
  }

  /**
   * Set group members
   */
  withMembers(members: GroupMemberSummaryDTO[]): GroupBuilder {
    this.members = members;
    return this;
  }

  /**
   * Set group currencies
   */
  withCurrencies(currencies: GroupCurrencyDTO[]): GroupBuilder {
    this.currencies = currencies;
    return this;
  }

  /**
   * Set pending invitations
   */
  withInvitations(invitations: PendingInvitationDTO[]): GroupBuilder {
    this.invitations = invitations;
    return this;
  }

  /**
   * Build a GroupListItemDTO for listing groups
   */
  buildGroupListItem(): GroupListItemDTO {
    if (!this.groupData) {
      throw new Error("Group data is required to build GroupListItemDTO");
    }

    return {
      id: this.groupData.id,
      name: this.groupData.name,
      base_currency_code: this.groupData.base_currency_code,
      status: this.groupData.status,
      created_at: this.groupData.created_at,
      role: this.userRole,
      my_balance: this.userBalance,
      members: this.members,
    };
  }

  /**
   * Build a GroupDetailDTO for detailed group view
   */
  buildGroupDetail(): GroupDetailDTO {
    if (!this.groupData) {
      throw new Error("Group data is required to build GroupDetailDTO");
    }

    return {
      id: this.groupData.id,
      name: this.groupData.name,
      base_currency_code: this.groupData.base_currency_code,
      status: this.groupData.status,
      created_at: this.groupData.created_at,
      my_role: this.userRole,
      members: this.members,
      group_currencies: this.currencies,
      pending_invitations: this.invitations,
    };
  }

  /**
   * Build a CreateGroupResponseDTO for group creation
   */
  buildCreateGroupResponse(invitationsResult: InvitationResultDTO): CreateGroupResponseDTO {
    if (!this.groupData) {
      throw new Error("Group data is required to build CreateGroupResponseDTO");
    }

    return {
      ...this.groupData,
      role: this.userRole,
      invitations: invitationsResult,
    };
  }

  /**
   * Reset the builder to initial state
   */
  reset(): GroupBuilder {
    this.groupData = null;
    this.members = [];
    this.currencies = [];
    this.invitations = [];
    this.userRole = "member";
    this.userBalance = 0;
    return this;
  }
}

/**
 * Factory functions for common GroupBuilder configurations
 */
export const GroupBuilderFactory = {
  /**
   * Create a builder pre-configured for group list items
   */
  forGroupList(supabase: SupabaseClient<Database>): GroupBuilder {
    return new GroupBuilder(supabase);
  },

  /**
   * Create a builder pre-configured for group details
   */
  forGroupDetail(supabase: SupabaseClient<Database>): GroupBuilder {
    return new GroupBuilder(supabase);
  },

  /**
   * Create a builder pre-configured for group creation response
   */
  forGroupCreation(supabase: SupabaseClient<Database>): GroupBuilder {
    return new GroupBuilder(supabase);
  },
} as const;
