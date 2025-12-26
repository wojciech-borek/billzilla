/**
 * API Endpoint: POST /api/chat
 * Processes AI chat messages for expense analysis
 */

import type { APIRoute } from "astro";
import { chatRequestSchema } from "@/lib/schemas/chatSchemas";
import { ChatService, ChatServiceError } from "@/lib/services/ai/ChatService";
import type { ErrorResponseDTO } from "@/types";
import type { ChatResponse } from "@/lib/ai/chatTypes";

export const prerender = false;

/**
 * POST /api/chat
 * Processes a chat message and returns AI response with function calling
 *
 * Request body:
 * - group_id (required): UUID of the group
 * - conversation_id (optional): UUID of existing conversation
 * - message (required): User's message (1-2000 chars)
 * - context (optional): { timezone, language }
 *
 * @requires Authentication - User must be logged in
 * @requires Membership - User must be an active member of the group
 *
 * @returns 200 - Chat response with messages and metadata
 * @returns 400 - Validation error or suspicious message
 * @returns 401 - Unauthorized (not authenticated)
 * @returns 403 - Forbidden (function call not allowed)
 * @returns 404 - Conversation not found
 * @returns 429 - Rate limit exceeded
 * @returns 500 - Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
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

    // Step 2: Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
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

    // Step 3: Validate request body with Zod schema
    const validationResult = chatRequestSchema.safeParse(requestBody);
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

    const { group_id, conversation_id, message, context } = validationResult.data;

    // Step 4: Get OpenRouter API key from environment
    const openRouterApiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.error("[ChatAPI] OPENROUTER_API_KEY not configured");
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "AI service is not properly configured",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Initialize ChatService
    const chatService = new ChatService({
      supabase: locals.supabase,
      openRouterApiKey,
    });

    // Step 6: Process chat message
    const chatResponse: ChatResponse = await chatService.processChatMessage({
      userId: locals.user.id,
      groupId: group_id,
      conversationId: conversation_id || undefined,
      message,
      context,
    });

    // Step 7: Return success response with rate limit headers
    return new Response(JSON.stringify(chatResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": String(chatResponse.rate_limit.remaining),
        "X-RateLimit-Reset": chatResponse.rate_limit.reset_at,
      },
    });
  } catch (error) {
    // Handle ChatService errors
    if (error instanceof ChatServiceError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: error.code,
          message: error.message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    console.error("[ChatAPI] Unexpected error:", error);
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: `An unexpected error occurred while processing your message: ${error instanceof Error ? error.message : String(error)}`,
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * GET /api/chat
 * Retrieves chat history for a group or dashboard conversation
 *
 * Query params:
 * - group_id (required): UUID of the group or 'null' for dashboard
 *
 * @returns 200 - Chat response with messages
 * @returns 401 - Unauthorized
 * @returns 400 - Validation error
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Check authentication
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

    // 2. Parse query params
    const url = new URL(request.url);
    const groupIdParam = url.searchParams.get("group_id");

    // group_id can be a UUID or explicitly "null" string (for dashboard)
    // If it's effectively null/empty, we treat it as global dashboard
    let groupId: string | null = groupIdParam;
    if (groupId === "null" || groupId === "undefined" || !groupId) {
      groupId = null;
    }

    // 3. Setup OpenRouter API (needed for ChatService init)
    const openRouterApiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "AI service is not properly configured",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Initialize ChatService
    const chatService = new ChatService({
      supabase: locals.supabase,
      openRouterApiKey,
    });

    // 5. Get conversation history
    const chatResponse: ChatResponse = await chatService.getLatestConversation(locals.user.id, groupId);

    // 6. Return response
    return new Response(JSON.stringify(chatResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[ChatAPI] Unexpected error in GET:", error);
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while fetching chat history",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
