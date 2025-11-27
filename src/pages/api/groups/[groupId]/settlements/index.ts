import type { APIRoute } from "astro";
import { createSettlementSchema, listSettlementsQuerySchema } from "../../../../../lib/schemas/settlementSchemas";
import { SettlementService, SettlementError } from "../../../../../lib/services/settlementService";
import { SettlementRepository } from "../../../../../lib/services/repositories/SettlementRepository";
import { BalanceRepository } from "../../../../../lib/services/repositories/BalanceRepository";
import type { ErrorResponseDTO, PaginatedResponse, SettlementDTO } from "../../../../../types";

export const prerender = false;

/**
 * GET /api/groups/:groupId/settlements
 * Lists settlements for a group
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
  try {
    const { groupId } = params;
    if (!groupId) {
      return new Response(JSON.stringify({ error: { code: "BAD_REQUEST", message: "Group ID is required" } }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check authentication
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is a member of the group
    const supabase = locals.supabase;
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("profile_id")
      .eq("group_id", groupId)
      .eq("profile_id", user.id)
      .eq("status", "active")
      .single();

    if (membershipError || !membership) {
      return new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "Not a member of this group" } }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse query params
    const queryParams = {
      limit: url.searchParams.get("limit") || undefined,
      offset: url.searchParams.get("offset") || undefined,
      sort: url.searchParams.get("sort") || undefined,
    };

    const validationResult = listSettlementsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Invalid query parameters",
          details: validationResult.error.flatten() 
        } 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const settlementService = new SettlementService(
      new SettlementRepository(supabase),
      new BalanceRepository(supabase)
    );
    const result = await settlementService.listSettlements(groupId, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error listing settlements:", error);
    const status = error instanceof SettlementError ? 400 : 500;
    const message = error instanceof Error ? error.message : "Internal server error";
    
    return new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", message } }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/groups/:groupId/settlements
 * Creates a new settlement
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const { groupId } = params;
    if (!groupId) {
      return new Response(JSON.stringify({ error: { code: "BAD_REQUEST", message: "Group ID is required" } }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check authentication
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is a member of the group
    const supabase = locals.supabase;
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("profile_id")
      .eq("group_id", groupId)
      .eq("profile_id", user.id)
      .eq("status", "active")
      .single();

    if (membershipError || !membership) {
      return new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "Not a member of this group" } }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: { code: "INVALID_JSON", message: "Invalid JSON" } }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate body
    const validationResult = createSettlementSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Invalid request data",
          details: validationResult.error.flatten() 
        } 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const settlementService = new SettlementService(
      new SettlementRepository(supabase),
      new BalanceRepository(supabase)
    );
    const result = await settlementService.createSettlement(groupId, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error creating settlement:", error);
    const status = error instanceof SettlementError ? 400 : 500;
    const message = error instanceof Error ? error.message : "Internal server error";
    
    return new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", message } }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
