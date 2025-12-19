/**
 * API endpoint for specific currency operations in a group
 * PATCH /api/groups/:groupId/currencies/:code - Update currency exchange rate
 * DELETE /api/groups/:groupId/currencies/:code - Remove currency from group
 */

import type { APIRoute } from "astro";
import type { ErrorResponseDTO, GroupCurrencyDTO } from "@/types";
import { updateCurrencySchema } from "@/lib/schemas/currencySchemas";
import { updateCurrencyRate, removeCurrencyFromGroup, CurrencyOperationError } from "@/lib/services/currencyService";
import { verifyGroupMembership, verifyGroupCreator } from "@/lib/services/memberService";

export const prerender = false;

/**
 * PATCH /api/groups/:groupId/currencies/:code
 * Updates the exchange rate of a currency in a group
 *
 * Requirements:
 * - User must be authenticated
 * - User must be a member of the group
 * - User must be the creator of the group (only creators can manage currencies)
 * - Cannot update the base currency
 *
 * Request body:
 * - exchange_rate: number (0.0001 - 9999.9999, max 4 decimal places)
 *
 * Returns:
 * - 200: Exchange rate updated successfully
 * - 400: Invalid request data
 * - 401: User not authenticated
 * - 403: User is not a member, not the creator, or trying to update base currency
 * - 404: Group or currency not found
 * - 422: Validation error
 * - 500: Internal server error
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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

    // Get parameters
    const { groupId, code } = params;
    if (!groupId || !code) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_REQUEST",
          message: "Group ID and currency code are required",
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
    const validationResult = updateCurrencySchema.safeParse(body);
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

    const { exchange_rate } = validationResult.data;

    // Update currency rate
    const updatedCurrency: GroupCurrencyDTO = await updateCurrencyRate(locals.supabase, groupId, code, exchange_rate);

    return new Response(JSON.stringify(updatedCurrency), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific errors
    if (error instanceof CurrencyOperationError) {
      const message = error.message;

      // Cannot update base currency
      if (message.includes("base currency")) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "CANNOT_UPDATE_BASE_CURRENCY",
            message: "Cannot update the base currency",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
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
    console.error("Unexpected error updating currency rate:", error);
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while updating the currency rate",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/groups/:groupId/currencies/:code
 * Removes a currency from a group
 *
 * Requirements:
 * - User must be authenticated
 * - User must be a member of the group
 * - User must be the creator of the group (only creators can manage currencies)
 * - Cannot delete the base currency
 * - Currency must not be used in any expenses
 *
 * Returns:
 * - 200: Currency removed successfully
 * - 401: User not authenticated
 * - 403: User is not a member, not the creator, or trying to delete base currency
 * - 404: Group or currency not found
 * - 409: Currency is used in existing expenses
 * - 500: Internal server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // Get parameters
    const { groupId, code } = params;
    if (!groupId || !code) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_REQUEST",
          message: "Group ID and currency code are required",
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

    // Remove currency from group
    await removeCurrencyFromGroup(locals.supabase, groupId, code);

    return new Response(
      JSON.stringify({
        message: "Currency removed from group",
        currency_code: code,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle specific errors
    if (error instanceof CurrencyOperationError) {
      const message = error.message;

      // Cannot delete base currency
      if (message.includes("base currency")) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "CANNOT_REMOVE_BASE_CURRENCY",
            message: "Cannot remove the base currency",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Currency is used in expenses
      if (message.includes("used in existing expenses")) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "CURRENCY_IN_USE",
            message: "Cannot remove currency that is used in existing expenses",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
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
    console.error("Unexpected error removing currency:", error);
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while removing the currency",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
