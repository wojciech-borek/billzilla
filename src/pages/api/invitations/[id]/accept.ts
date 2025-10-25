/**
 * API endpoint for accepting invitations
 * POST /api/invitations/:id/accept - Accept a pending invitation
 */

import type { APIRoute } from "astro";
import type { AcceptInvitationResponseDTO, ErrorResponseDTO } from "../../../../types";

interface InvitationWithGroup {
  id: string;
  email: string;
  status: string;
  group_id: string;
  group: {
    id: string;
    name: string;
  };
}

export const prerender = false;

/**
 * POST /api/invitations/:id/accept
 * Accepts a pending invitation for the authenticated user
 *
 * Returns:
 * - 200: Invitation accepted successfully
 * - 400: Invalid invitation or already processed
 * - 401: User not authenticated
 * - 403: User not authorized to accept this invitation
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
          message: "You must be logged in to accept invitations",
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
      .select(
        `
        id,
        email,
        status,
        group_id,
        group:groups (
          id,
          name
        )
      `
      )
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
          message: "You are not authorized to accept this invitation",
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

    // Use the atomic function to accept invitation and add user to group
    console.log("Calling accept_invitation_transaction with:", {
      invitation_id: invitationId,
      user_id: user.id,
      user_email: user.email,
      invitation_email: invitation.email,
      invitation_status: invitation.status
    });

    const { data: result, error: functionError } = await supabase
      .rpc("accept_invitation_transaction", {
        p_invitation_id: invitationId,
        p_user_id: user.id,
      });

    console.log("Function call result:", { success: !functionError, error: functionError, data: result });

    if (functionError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "DATABASE_ERROR",
          message: "Failed to accept invitation",
          details: { message: functionError.message, code: functionError.code }
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response: AcceptInvitationResponseDTO = {
      message: "Invitation accepted successfully",
      invitation_id: result[0].invitation_id,
      group_id: result[0].group_id,
      group_name: result[0].group_name,
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
