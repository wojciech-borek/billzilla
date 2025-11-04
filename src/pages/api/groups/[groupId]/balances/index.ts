/**
 * API Endpoint: GET /api/groups/:groupId/balances
 * Calculates balances and settlement suggestions for all group members
 */

import type { APIRoute } from "astro";
import { getGroupBalances } from "../../../../../lib/services/balanceService";
import type { ErrorResponseDTO } from "../../../../../types";

export const prerender = false;

/**
 * GET /api/groups/:groupId/balances
 * Calculates balances and settlement suggestions for all group members
 *
 * @requires Authentication - User must be logged in
 * @requires Membership - User must be an active member of the group
 *
 * @returns 200 - Group balances with member balances and settlement suggestions
 * @returns 401 - Unauthorized (not authenticated)
 * @returns 404 - Group not found or user is not a member
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    // Step 1: Check authentication
    if (!locals.user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Extract groupId from params
    const { groupId } = params;
    if (!groupId) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_REQUEST",
          message: "Group ID is required",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Call service to get group balances
    const balancesDTO = await getGroupBalances(locals.supabase, groupId, locals.user.id);

    // Step 4: Return success response
    return new Response(JSON.stringify(balancesDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle access errors
    if (error instanceof Error && (error.message.includes("not found") || error.message.includes("not a member"))) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "NOT_FOUND",
          message: error.message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: `An unexpected error occurred while calculating balances: ${error instanceof Error ? error.message : String(error)}`,
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
