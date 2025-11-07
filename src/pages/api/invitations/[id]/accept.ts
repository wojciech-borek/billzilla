/**
 * API endpoint for accepting invitations
 * POST /api/invitations/:id/accept - Accept a pending invitation
 */

import type { APIRoute } from "astro";
import type { ErrorResponseDTO } from "../../../../types";
import { acceptInvitation } from "../../../../lib/services/invitationService";

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

    // Use the invitation service to accept the invitation
    // This handles all validation and business logic
    const result = await acceptInvitation(supabase, invitationId, user.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);

    // Handle specific invitation service errors
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
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

      if (error.message.includes("not authorized") || error.message.includes("does not have access")) {
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

      if (error.message.includes("already")) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "INVALID_STATUS",
            message: error.message,
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Generic error response
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while accepting the invitation",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
