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


    // Fetch pending invitations for the user's email with group_id
    const { data: invitations, error } = await supabase
      .from("invitations")
      .select("id, email, status, created_at, group_id")
      .eq("email", user.email.toLowerCase())
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

    // If no invitations, return empty array
    if (!invitations || invitations.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get unique group IDs
    const groupIds = [...new Set(invitations.map(inv => inv.group_id))];


    // Fetch group data for these invitations
    const { data: groups, error: groupsError } = await supabase
      .from("groups")
      .select("id, name")
      .in("id", groupIds);

    console.log("Groups query result:", { data: groups, error: groupsError });

    if (groupsError) {
      console.error("Failed to fetch groups for invitations:", groupsError);
      // Continue with empty groups - we'll handle missing groups gracefully
    }

    // Create a map of group data
    const groupMap = new Map(groups?.map(g => [g.id, g]) || []);

    // Map to DTO format, filtering out invitations with missing groups
    const invitationDTOs: InvitationDTO[] = invitations
      .filter((inv) => {
        const group = groupMap.get(inv.group_id);
        if (!group) {
          console.warn(`Group not found for invitation ${inv.id}, skipping`);
          return false;
        }
        return true;
      })
      .map((inv) => {
        const group = groupMap.get(inv.group_id)!; // We already filtered, so it exists
        return {
          id: inv.id,
          email: inv.email,
          status: inv.status,
          created_at: inv.created_at,
          group: {
            id: group.id,
            name: group.name,
          },
        };
      });

    return new Response(JSON.stringify(invitationDTOs), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in /api/invitations:", error);
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
