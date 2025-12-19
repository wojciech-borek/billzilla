/**
 * API endpoint for fetching all available currencies
 * GET /api/currencies - Get all currencies from the system
 */

import type { APIRoute } from "astro";
import type { ErrorResponseDTO, CurrencyDTO } from "../../../types";
import { getAllCurrencies } from "../../../lib/services/currencyService";

export const prerender = false;

/**
 * GET /api/currencies
 * Gets all available currencies from the system
 *
 * This endpoint is public (no authentication required) as it returns
 * static reference data that doesn't contain sensitive information.
 *
 * Returns:
 * - 200: Array of all currencies with code and name
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const currencies: CurrencyDTO[] = await getAllCurrencies(locals.supabase);

    return new Response(JSON.stringify(currencies), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching currencies:", error);
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while fetching currencies",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
