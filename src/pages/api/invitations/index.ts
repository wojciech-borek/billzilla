/**
 * API endpoint for invitations
 * GET /api/invitations - List pending invitations for user
 */

import type { APIRoute } from "astro";
import type { ErrorResponseDTO } from "../../../types";
import { getUserInvitations } from "../../../lib/services/invitationService";

export const prerender = false;

/**
 * GET /api/invitations
 * Lists pending invitations for the authenticated user
 *
 * Returns invitations for both existing users (by profile_id) and new users (by email)
 * - 200: List of pending invitations with group info
 * - 401: User not authenticated
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Check authentication
    const user = locals.user;
    if (!user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to view invitations",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = locals.supabase;

    // Use the invitation service to get all invitations for the user
    // This combines invitations for existing users (by invitee_profile_id)
    // and new users (by email where invitee_profile_id is null)
    const invitations = await getUserInvitations(supabase, user.id, user.email.toLowerCase());

    return new Response(JSON.stringify(invitations), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
