/**
 * API endpoint for declining invitations
 * POST /api/invitations/:id/decline - Decline a pending invitation
 */

import type { APIRoute } from "astro";
import type { DeclineInvitationResponseDTO, ErrorResponseDTO } from "../../../../types";

export const prerender = false;

/**
 * POST /api/invitations/:id/decline
 * Declines a pending invitation for the authenticated user
 *
 * Returns:
 * - 200: Invitation declined successfully
 * - 400: Invalid invitation or already processed
 * - 401: User not authenticated
 * - 403: User not authorized to decline this invitation
 * - 404: Invitation not found
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ params, locals }) => {
  try {
    // Check authentication
    const user = locals.user;
    if (!user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to decline invitations",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const invitationId = params.id;
    if (!invitationId) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_PARAMS",
          message: "Invitation ID is required",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = locals.supabase;

    // First, verify the invitation exists and belongs to the user
    const { data: invitation, error: fetchError } = await supabase
      .from("invitations")
      .select("id, email, status")
      .eq("id", invitationId)
      .single();

    if (fetchError || !invitation) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVITATION_NOT_FOUND",
          message: "Invitation not found",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if the invitation belongs to the current user
    if (invitation.email !== user.email) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "FORBIDDEN",
          message: "You are not authorized to decline this invitation",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if invitation is still pending
    if (invitation.status !== "pending") {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_STATUS",
          message: `Invitation is already ${invitation.status}`,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mark invitation as declined
    const { error: updateError } = await supabase
      .from("invitations")
      .update({ status: "declined" })
      .eq("id", invitationId);

    if (updateError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "DATABASE_ERROR",
          message: "Failed to decline invitation",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response: DeclineInvitationResponseDTO = {
      message: "Invitation declined successfully",
      invitation_id: invitationId,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
