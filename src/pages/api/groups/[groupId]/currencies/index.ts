/**
 * API endpoint for group currencies operations
 * GET /api/groups/:groupId/currencies - Get currencies available in a group
 */

import type { APIRoute } from "astro";
import type { ErrorResponseDTO, GroupCurrenciesDTO } from "../../../../../types";
import { getGroupCurrencies } from "../../../../../lib/services/groupService";

export const prerender = false;

/**
 * GET /api/groups/:groupId/currencies
 * Gets currencies available in a specific group with exchange rates
 *
 * Requirements:
 * - User must be authenticated
 * - User must be a member of the group (handled by service function)
 *
 * Returns:
 * - 200: GroupCurrenciesDTO with base and additional currencies
 * - 401: User not authenticated
 * - 403: User is not a member of the group
 * - 404: Group not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Check authentication
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

    // Get group ID from params
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

    // Fetch group currencies
    const currenciesData = await getGroupCurrencies(locals.supabase, groupId, locals.user.id);

    return new Response(JSON.stringify(currenciesData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching group currencies:", error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("not a member")) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "NOT_FOUND",
            message: "Group not found or you are not a member",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while fetching group currencies",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
