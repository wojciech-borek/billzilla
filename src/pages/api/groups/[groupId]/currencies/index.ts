/**
 * API endpoint for group currencies operations
 * GET /api/groups/:groupId/currencies - Get currencies available in a group
 * POST /api/groups/:groupId/currencies - Add a new currency to a group
 */

import type { APIRoute } from "astro";
import type { ErrorResponseDTO, GroupCurrenciesDTO, GroupCurrencyDTO } from "@/types";
import { getGroupCurrencies } from "@/lib/services/groupService";
import { addCurrencySchema } from "@/lib/schemas/currencySchemas";
import { addCurrencyToGroup, CurrencyOperationError } from "@/lib/services/currencyService";
import { verifyGroupMembership, verifyGroupCreator } from "@/lib/services/memberService";

export const prerender = false;

/**
 * GET /api/groups/:groupId/currencies
 * Gets currencies available in a specific group with exchange rates
 *
 * Requirements:
 * - User must be authenticated
 * - User must be a member of the group (handled by service function)
 *
 * Returns:
 * - 200: GroupCurrenciesDTO with base and additional currencies
 * - 401: User not authenticated
 * - 403: User is not a member of the group
 * - 404: Group not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Check authentication
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

    // Get group ID from params
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

    // Fetch group currencies
    const currenciesData: GroupCurrenciesDTO = await getGroupCurrencies(locals.supabase, groupId, locals.user.id);

    return new Response(JSON.stringify(currenciesData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("not a member")) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "NOT_FOUND",
            message: "Group not found or you are not a member",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while fetching group currencies",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/groups/:groupId/currencies
 * Adds a new currency to a group with a specified exchange rate
 *
 * Requirements:
 * - User must be authenticated
 * - User must be a member of the group
 * - User must be the creator of the group (only creators can manage currencies)
 * - Currency code must exist in the system
 * - Currency cannot be the base currency of the group
 * - Currency cannot already be added to the group
 *
 * Request body:
 * - currency_code: string (3 uppercase letters)
 * - exchange_rate: number (0.0001 - 9999.9999, max 4 decimal places)
 *
 * Returns:
 * - 201: Currency added successfully
 * - 400: Invalid request data
 * - 401: User not authenticated
 * - 403: User is not a member or not the creator
 * - 404: Currency code not found in system
 * - 409: Currency already exists in group
 * - 422: Validation error (e.g., trying to add base currency)
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Check authentication
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

    // Get group ID from params
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

    // Verify user is a member of the group
    const isMember = await verifyGroupMembership(locals.supabase, groupId, locals.user.id);
    if (!isMember) {
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

    // Verify user is the creator of the group
    const isCreator = await verifyGroupCreator(locals.supabase, groupId, locals.user.id);
    if (!isCreator) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "FORBIDDEN",
          message: "Only the group creator can manage currencies",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
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
    const validationResult = addCurrencySchema.safeParse(body);
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

    const { currency_code, exchange_rate } = validationResult.data;

    // Add currency to group
    const addedCurrency: GroupCurrencyDTO = await addCurrencyToGroup(
      locals.supabase,
      groupId,
      currency_code,
      exchange_rate
    );

    return new Response(JSON.stringify(addedCurrency), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific errors
    if (error instanceof CurrencyOperationError) {
      const message = error.message;

      // Currency not found in system
      if (message.includes("does not exist")) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "CURRENCY_NOT_FOUND",
            message: "Currency code does not exist in the system",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Currency already exists in group
      if (message.includes("already exists")) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "CURRENCY_ALREADY_EXISTS",
            message: "Currency already exists in this group",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Cannot add base currency
      if (message.includes("base currency")) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "CANNOT_ADD_BASE_CURRENCY",
            message: "Cannot add the base currency to the group",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Group not found
      if (message.includes("Group not found")) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "GROUP_NOT_FOUND",
            message: "Group not found",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Handle unexpected errors
    console.error("Unexpected error adding currency:", error);
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while adding the currency",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
