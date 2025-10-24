/**
 * API endpoint for invitations
 * GET /api/invitations - List pending invitations for user
 */

import type { APIRoute } from "astro";
import type { InvitationDTO, ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/invitations
 * Lists pending invitations for the authenticated user
 *
 * Returns:
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

    // Fetch pending invitations for the user's email
    const { data: invitations, error } = await supabase
      .from("invitations")
      .select(
        `
        id,
        email,
        status,
        created_at,
        group:groups (
          id,
          name
        )
      `
      )
      .eq("email", user.email)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "DATABASE_ERROR",
          message: "Failed to fetch invitations",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Map to DTO format
    const invitationDTOs: InvitationDTO[] = (invitations || []).map((inv) => ({
      id: inv.id,
      email: inv.email,
      status: inv.status,
      created_at: inv.created_at,
      group: {
        id: (inv.group as { id: string; name: string }).id,
        name: (inv.group as { id: string; name: string }).name,
      },
    }));

    return new Response(JSON.stringify(invitationDTOs), {
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
