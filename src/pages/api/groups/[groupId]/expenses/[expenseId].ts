/**
 * API Endpoint: GET /api/groups/:groupId/expenses/:expenseId
 * Gets detailed information about a specific expense including splits
 */

import type { APIRoute } from "astro";
import { getExpense, ExpenseAccessError, ExpenseDataError } from "../../../../../lib/services/expenseService";
import type { ErrorResponseDTO, ExpenseDTO } from "../../../../../types";

export const prerender = false;

/**
 * GET /api/groups/:groupId/expenses/:expenseId
 * Gets detailed information about a specific expense including all splits
 *
 * @requires Authentication - User must be logged in
 * @requires Membership - User must be an active member of the group
 * @requires Ownership - Expense must belong to the specified group
 *
 * @returns 200 - Expense details with splits
 * @returns 401 - Unauthorized (not authenticated)
 * @returns 404 - Group not found, user is not a member, or expense not found
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    // Step 1: Check authentication
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

    // Step 2: Extract parameters
    const { groupId, expenseId } = params;
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

    if (!expenseId) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_REQUEST",
          message: "Expense ID is required",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Call service to get expense details
    const expenseDTO: ExpenseDTO = await getExpense(locals.supabase, groupId, expenseId, locals.user.id);

    // Step 4: Return success response
    return new Response(JSON.stringify(expenseDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle access errors
    if (error instanceof ExpenseAccessError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "NOT_FOUND",
          message: error.message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle data errors
    if (error instanceof ExpenseDataError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "NOT_FOUND",
          message: error.message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: `An unexpected error occurred while fetching expense details: ${error instanceof Error ? error.message : String(error)}`,
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
