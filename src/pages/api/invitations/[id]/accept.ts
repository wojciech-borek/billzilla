/**
 * API endpoint for accepting invitations
 * POST /api/invitations/:id/accept - Accept a pending invitation
 */

import type { APIRoute } from "astro";
import type { AcceptInvitationResponseDTO, ErrorResponseDTO } from "../../../../types";

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
      console.error("Error fetching invitation:", fetchError);
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

    // Check if user is already a member of the group
    const { data: existingMember, error: memberCheckError } = await supabase
      .from("group_members")
      .select("profile_id")
      .eq("group_id", invitation.group_id)
      .eq("profile_id", user.id)
      .single();

    if (memberCheckError && memberCheckError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error checking existing membership:", memberCheckError);
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "DATABASE_ERROR",
          message: "Failed to check group membership",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (existingMember) {
      // User is already a member, just mark invitation as accepted
      const { error: updateError } = await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invitationId);

      if (updateError) {
        console.error("Error updating invitation status:", updateError);
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to update invitation status",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // Add user to group and mark invitation as accepted
      // First add user to group
      const { error: memberError } = await supabase.from("group_members").insert({
        group_id: invitation.group_id,
        profile_id: user.id,
        role: "member",
        status: "active",
      });

      if (memberError) {
        console.error("Error adding user to group:", memberError);
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to add user to group",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Then mark invitation as accepted
      const { error: updateError } = await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invitationId);

      if (updateError) {
        console.error("Error updating invitation status:", updateError);
        // Try to rollback the group membership addition
        await supabase.from("group_members").delete().eq("group_id", invitation.group_id).eq("profile_id", user.id);

        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to update invitation status",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const response: AcceptInvitationResponseDTO = {
      message: "Invitation accepted successfully",
      invitation_id: invitationId,
      group_id: invitation.group_id,
      group_name: (invitation.group as any).name,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/invitations/:id/accept:", error);
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
