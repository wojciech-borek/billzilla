/**
 * API endpoint for individual group operations
 * GET /api/groups/:groupId - Get detailed group information
 */

import type { APIRoute } from "astro";
import type { ErrorResponseDTO, GroupDetailDTO } from "../../../../types";
import { getGroupDetails } from "../../../../lib/services/groupService";

export const prerender = false;

/**
 * GET /api/groups/:groupId
 * Gets detailed information about a specific group including members and invitations
 *
 * Requirements:
 * - User must be authenticated
 * - User must be a member of the group (handled by RLS)
 *
 * Returns:
 * - 200: GroupDetailDTO with group info, members, and pending invitations
 * - 401: User not authenticated
 * - 404: Group not found or user is not a member
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

    // Fetch group details from database
    const groupData = await getGroupDetails(locals.supabase, groupId, locals.user.id);

    return new Response(JSON.stringify(groupData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while fetching the group",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
