/**
 * API endpoint for groups
 * GET /api/groups - List groups for user
 * POST /api/groups - Create a new group
 */

import type { APIRoute } from "astro";
import { createGroupSchema, listGroupsQuerySchema } from "../../../lib/schemas/groupSchemas";
import { createGroup, listGroups, CurrencyNotFoundError, TransactionError } from "../../../lib/services/groupService";
import type {
  CreateGroupCommand,
  CreateGroupResponseDTO,
  ErrorResponseDTO,
  PaginatedResponse,
  GroupListItemDTO,
} from "../../../types";

export const prerender = false;

/**
 * GET /api/groups
 * Lists groups for the authenticated user with computed fields
 *
 * Query parameters:
 * - status: "active" | "archived" (optional, default: "active")
 * - limit: number 1-100 (optional, default: 50)
 * - offset: number >= 0 (optional, default: 0)
 *
 * Returns:
 * - 200: Paginated list of groups
 * - 400: Invalid query parameters
 * - 401: User not authenticated
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Check authentication
    const user = locals.user;
    if (!user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to view groups",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate query parameters
    const queryParams = {
      status: url.searchParams.get("status") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      offset: url.searchParams.get("offset") || undefined,
    };

    const validationResult = listGroupsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: validationResult.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedQuery = validationResult.data;

    // Call service to list groups
    const supabase = locals.supabase;
    const result: PaginatedResponse<GroupListItemDTO> = await listGroups(supabase, user.id, {
      status: validatedQuery.status,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
    });

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Handle unexpected errors
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while fetching groups",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/groups
 * Creates a new billing group with the authenticated user as creator
 *
 * Request body:
 * - name: string (1-100 chars)
 * - base_currency_code: string (3 chars)
 * - invite_emails: string[] (optional, max 20 emails)
 *
 * Returns:
 * - 201: Group created successfully
 * - 400: Invalid request data
 * - 401: User not authenticated
 * - 422: Currency not found
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const user = locals.user;
    if (!user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a group",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_JSON",
          message: "Invalid JSON in request body",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate with Zod schema
    const validationResult = createGroupSchema.safeParse(body);
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

    // Sanitize invite_emails
    let sanitizedEmails: string[] | undefined;
    if (validatedData.invite_emails && validatedData.invite_emails.length > 0) {
      // Remove duplicates, convert to lowercase, remove creator's own email
      const emailSet = new Set(
        validatedData.invite_emails
          .map((email) => email.toLowerCase().trim())
          .filter((email) => email !== user.email?.toLowerCase())
      );
      sanitizedEmails = Array.from(emailSet);
    }

    // Prepare command (without invite_emails - will handle separately)
    const command: CreateGroupCommand = {
      name: validatedData.name,
      base_currency_code: validatedData.base_currency_code,
      // invite_emails removed - will create invitations after group creation
    };

    // Call service to create group
    const supabase = locals.supabase;
    const result: CreateGroupResponseDTO = await createGroup(supabase, command, user.id);
    console.log(`DEBUG: createGroup result:`, { id: result.id, name: result.name, role: result.role });

    // Handle invitations separately (create invitations instead of direct membership)
    if (sanitizedEmails && sanitizedEmails.length > 0) {
      const { createInvitationForExistingUser, createInvitationForNewUser, findUserByEmail } = await import(
        "../../../lib/services/invitationService"
      );

      const { sendInvitationEmail } = await import("../../../lib/services/emailService");

      // Create invitations for each email
      const createdInvitations: { id: string; email: string; status: string }[] = [];
      for (const email of sanitizedEmails) {
        try {
          const existingUserId = await findUserByEmail(supabase, email);

          let invitation;
          if (existingUserId) {
            // Create invitation for existing user
            invitation = await createInvitationForExistingUser(supabase, result.id, email, existingUserId);

            // Send email to existing user
            await sendInvitationEmail(supabase, email, result.id, "existing_user", {
              user_name: "Użytkowniku",
              inviter_name: user.full_name || "Użytkownik Billzilla",
              group_name: result.name || command.name,
              accept_url: `${process.env.APP_URL || "http://localhost:4321"}/invitations/${invitation.id}/accept`,
              decline_url: `${process.env.APP_URL || "http://localhost:4321"}/invitations/${invitation.id}/decline`,
            });
          } else {
            // Create invitation for new user
            invitation = await createInvitationForNewUser(supabase, result.id, email);

            // Send email to new user
            const { generateInvitationToken } = await import("../../../lib/services/emailService");
            const invitationToken = await generateInvitationToken(invitation.id);

            await sendInvitationEmail(supabase, email, result.id, "new_user", {
              inviter_name: user.full_name || "Użytkownik Billzilla",
              group_name: result.name || command.name,
              signup_url: `${process.env.APP_URL || "http://localhost:4321"}/signup?invitation=${invitationToken}`,
              invitation_token: invitationToken,
            });
          }

          createdInvitations.push({
            id: invitation.id,
            email: invitation.email,
            status: invitation.status,
          });
        } catch (error) {
          // Log error but continue with other invitations
          console.error(`Failed to create invitation for ${email}:`, error);
        }
      }

      // Update the result to include created invitations instead of added members
      result.invitations = {
        added_members: [], // No members are directly added anymore
        created_invitations: createdInvitations,
      };
    }

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific errors
    if (error instanceof CurrencyNotFoundError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "CURRENCY_NOT_FOUND",
          message: error.message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof TransactionError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "TRANSACTION_ERROR",
          message: "Failed to create group due to a database error",
          details: { originalError: error.message },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while creating the group",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
