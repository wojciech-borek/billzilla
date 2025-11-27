import type { SupabaseClient } from "../../../db/supabase.client";
import type {
  CreateSettlementCommand,
  SettlementDTO,
  PaginatedResponse
} from "../../../types";

interface CreateSettlementData {
  group_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
}

interface ListOptions {
  limit?: number;
  offset?: number;
  sort?: "date_desc" | "date_asc";
}

/**
 * Repository pattern for settlement-related database operations
 * Encapsulates all data access logic for settlements
 */
export class SettlementRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new settlement record
   */
  async createSettlement(settlementData: CreateSettlementData): Promise<SettlementDTO> {
    const { data: settlement, error: createError } = await this.supabase
      .from("settlements")
      .insert({
        group_id: settlementData.group_id,
        payer_id: settlementData.payer_id,
        payee_id: settlementData.payee_id,
        amount: settlementData.amount,
      })
      .select(`
        *,
        payer:payer_id (
          id,
          full_name,
          avatar_url
        ),
        payee:payee_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (createError) {
      throw new Error(createError.message);
    }

    return this.mapToSettlementDTO(settlement);
  }

  /**
   * List settlements for a group with pagination
   */
  async listSettlements(
    groupId: string,
    options: ListOptions = {}
  ): Promise<PaginatedResponse<SettlementDTO>> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const sortAsc = options.sort === "date_asc";

    // Get data with count in single query
    const { data, error: fetchError, count } = await this.supabase
      .from("settlements")
      .select(`
        *,
        payer:payer_id (
          id,
          full_name,
          avatar_url
        ),
        payee:payee_id (
          id,
          full_name,
          avatar_url
        )
      `, { count: "exact" })
      .eq("group_id", groupId)
      .order("settled_at", { ascending: sortAsc })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const settlements = (data || []).map(this.mapToSettlementDTO);

    return {
      data: settlements,
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Verify if specified users are active members of the group
   */
  async verifyGroupMembers(groupId: string, memberIds: string[]): Promise<void> {
    const { data: members, error: membersError } = await this.supabase
      .from("group_members")
      .select("profile_id")
      .eq("group_id", groupId)
      .in("profile_id", memberIds);

    if (membersError) {
      throw new Error("Failed to verify members");
    }

    const foundMemberIds = new Set(members?.map(m => m.profile_id));
    for (const memberId of memberIds) {
      if (!foundMemberIds.has(memberId)) {
        throw new Error(`User ${memberId} is not a member of this group`);
      }
    }
  }

  /**
   * Helper to map DB result to DTO
   */
  private mapToSettlementDTO(dbRecord: any): SettlementDTO {
    // Handle potential array response from joins (though .single() or 1:1 should prevent it)
    const payer = Array.isArray(dbRecord.payer) ? dbRecord.payer[0] : dbRecord.payer;
    const payee = Array.isArray(dbRecord.payee) ? dbRecord.payee[0] : dbRecord.payee;

    return {
      id: dbRecord.id,
      group_id: dbRecord.group_id,
      amount: dbRecord.amount,
      settled_at: dbRecord.settled_at,
      payer: {
        id: payer?.id || dbRecord.payer_id,
        full_name: payer?.full_name || "Unknown",
        avatar_url: payer?.avatar_url || null,
      },
      payee: {
        id: payee?.id || dbRecord.payee_id,
        full_name: payee?.full_name || "Unknown",
        avatar_url: payee?.avatar_url || null,
      },
    };
  }
}
