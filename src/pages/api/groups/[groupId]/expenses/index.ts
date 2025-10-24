/**
 * API Endpoint: POST /api/groups/:groupId/expenses
 * Creates a new expense with splits in a group
 */

import type { APIRoute } from "astro";
import { createExpenseSchema } from "../../../../../lib/schemas/expenseSchemas";
import {
  createExpense,
  ExpenseValidationError,
  ExpenseNotFoundError,
} from "../../../../../lib/services/expenseService";
import type { ErrorResponseDTO } from "../../../../../types";

export const prerender = false;

/**
 * POST /api/groups/:groupId/expenses
 * Creates a new expense with splits among group members
 *
 * @requires Authentication - User must be logged in
 * @requires Membership - User must be an active member of the group
 * @requires Valid currency - Currency must be configured in the group
 * @requires Valid participants - All split participants must be active group members
 * @requires Valid payer - Payer must be an active member of the group
 *
 * @returns 201 - Expense created successfully with ExpenseDTO
 * @returns 400 - Validation error (invalid input, sum mismatch, invalid participants)
 * @returns 401 - Unauthorized (not authenticated)
 * @returns 404 - Group not found or user is not a member
 * @returns 500 - Internal server error
 */
export const POST: APIRoute = async ({ request, locals, params }) => {
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

    // Step 2: Extract groupId from params
    const { groupId } = params;
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

    // Step 3: Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (error) {
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

    // Step 4: Validate request body with Zod schema
    const validationResult = createExpenseSchema.safeParse(requestBody);
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

    // Step 5: Prepare command data, converting datetime-local format to ISO if needed
    const commandData = validationResult.data;
    let expenseDate = commandData.expense_date;
    if (expenseDate && expenseDate.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      expenseDate = expenseDate + ":00.000Z";
    }
    const command = { ...commandData, expense_date: expenseDate };

    // Step 6: Call service to create expense
    const expenseDTO = await createExpense(locals.supabase, groupId, locals.user.id, command);

    // Step 7: Return success response with 201 Created
    return new Response(JSON.stringify(expenseDTO), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known error types
    if (error instanceof ExpenseValidationError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "SEMANTIC_ERROR",
          message: error.message,
          details: error.details as Record<string, unknown> | undefined,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof ExpenseNotFoundError) {
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
        message: `An unexpected error occurred while creating the expense: ${error instanceof Error ? error.message : String(error)}`,
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
