/**
 * API endpoint for inviting members to a group
 * POST /api/groups/:groupId/members/invite
 */

import type { APIRoute } from "astro";
import { inviteMembersCommandSchema } from "@/lib/schemas/groupSchemas";
import {
  createInvitationForExistingUser,
  createInvitationForNewUser,
  findUserByEmail,
  InvitationOperationError,
} from "@/lib/services/invitationService";
import { sendInvitationEmail } from "@/lib/services/emailService";
import type { InviteMembersResponseDTO, ErrorResponseDTO, CreatedInvitationDTO, AddedMemberDTO } from "@/types";

export const prerender = false;

/**
 * POST /api/groups/:groupId/members/invite
 * Invites one or more users to join a group
 *
 * Body:
 * - emails: string[] (required, 1-20 emails)
 *
 * Returns:
 * - 200: Success with created invitations
 * - 400: Invalid request data
 * - 401: User not authenticated
 * - 403: User not authorized to invite to this group
 * - 404: Group not found
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check authentication
    const user = locals.user;
    if (!user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to invite members",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get group ID from URL params
    const groupId = params.groupId;
    if (!groupId) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Group ID is required",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is a member of the group (creator or member)
    const supabase = locals.supabase;
    const { error: membershipError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("profile_id", user.id)
      .eq("status", "active")
      .single();

    if (membershipError) {
      if (membershipError.code === "PGRST116") {
        // No membership found
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "FORBIDDEN",
            message: "You are not a member of this group",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw membershipError;
    }

    // Fetch group name for email templates
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .select("name")
      .eq("id", groupId)
      .single();

    if (groupError) {
      if (groupError.code === "PGRST116") {
        // Group not found
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "NOT_FOUND",
            message: "Group not found",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw groupError;
    }

    const groupName = groupData.name;

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (_error) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON in request body",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate with Zod schema
    const validationResult = inviteMembersCommandSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: validationResult.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedData = validationResult.data;

    // Process invitations
    const createdInvitations: CreatedInvitationDTO[] = [];
    const addedMembers: AddedMemberDTO[] = [];

    for (const email of validatedData.emails) {
      try {
        // Check if user already exists
        const existingUserId = await findUserByEmail(supabase, email);

        let invitation;
        if (existingUserId) {
          // Create invitation for existing user
          invitation = await createInvitationForExistingUser(supabase, groupId, email, existingUserId);

          // Fetch invited user's profile to get their name
          const { data: invitedUserProfile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", existingUserId)
            .single();

          // Derive user name with fallback chain
          const userName =
            invitedUserProfile?.full_name ||
            invitedUserProfile?.email?.split("@")[0] ||
            email.split("@")[0] ||
            "Użytkowniku";

          // Send email to existing user
          await sendInvitationEmail(supabase, email, groupId, "existing_user", {
            user_name: userName,
            inviter_name: user.full_name || "Użytkownik Billzilla",
            group_name: groupName,
            app_url: `${import.meta.env.APP_URL || "http://localhost:4321"}/login`,
          });
        } else {
          // Create invitation for new user
          invitation = await createInvitationForNewUser(supabase, groupId, email);

          // Send email to new user
          await sendInvitationEmail(supabase, email, groupId, "new_user", {
            inviter_name: user.full_name || "Użytkownik Billzilla",
            group_name: groupName,
            app_url: `${import.meta.env.APP_URL || "http://localhost:4321"}/login`,
          });
        }

        createdInvitations.push({
          id: invitation.id,
          email: invitation.email,
          status: invitation.status,
        });
      } catch (_error) {
        // If invitation creation fails for this email, continue with others silently
      }
    }

    // Prepare response
    const response: InviteMembersResponseDTO = {
      added_members: addedMembers,
      created_invitations: createdInvitations,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in invite members API:", error);

    // Handle known errors
    if (error instanceof InvitationOperationError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVITATION_ERROR",
          message: (error as InvitationOperationError).message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic error response
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while processing invitations",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
