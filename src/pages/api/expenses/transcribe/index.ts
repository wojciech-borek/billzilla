/**
 * API Endpoint: POST /api/expenses/transcribe
 * Transcribes audio and extracts expense data synchronously
 *
 * This endpoint handles the synchronous processing of audio files:
 * 1. Validates user authentication and group membership
 * 2. Validates audio file (format, size)
 * 3. Processes audio directly (Whisper → LLM)
 * 4. Returns transcription and expense data immediately
 */

import type { APIRoute } from "astro";
import type { ErrorResponseDTO, TranscriptionResultDTO } from "../../../../types";
import {
  AudioTranscriptionService,
  TaskProcessingError,
  GroupContextError,
  ValidationError,
} from "../../../../lib/services/audioTranscriptionService";
import { z } from "zod";

export const prerender = false;

/**
 * POST /api/expenses/transcribe
 * Transcribes audio and extracts expense data synchronously
 *
 * @requires Authentication - User must be logged in
 * @requires Membership - User must be an active member of the group
 * @requires Valid audio file - Max 25MB, supported formats
 *
 * @returns 200 - Audio processed successfully, returns transcription and expense data
 * @returns 400 - Invalid request (missing fields, invalid file)
 * @returns 401 - Unauthorized (not authenticated)
 * @returns 403 - Forbidden (not a group member)
 * @returns 413 - Payload too large (file > 25MB)
 * @returns 500 - Internal server error
 * @returns 503 - AI service unavailable
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

    // Step 2: Parse multipart/form-data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid multipart/form-data request",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Extract and validate required fields
    const audioFile = formData.get("audio");
    const groupId = formData.get("group_id");

    // Guard clause: validate audio file
    if (!audioFile || !(audioFile instanceof File)) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "MISSING_AUDIO",
          message: "Audio file is required",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Guard clause: validate group_id
    if (!groupId || typeof groupId !== "string") {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "MISSING_GROUP_ID",
          message: "Group ID is required",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const groupIdValidation = z.string().uuid();
    const validationResult = groupIdValidation.safeParse(groupId);

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_GROUP_ID",
          message: "Invalid group ID format",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Guard clause: check file size (25MB limit)
    const maxSize = 25 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "FILE_TOO_LARGE",
          message: `Audio file too large. Maximum size: 25MB, received: ${(audioFile.size / 1024 / 1024).toFixed(2)}MB`,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Guard clause: validate audio MIME type
    const supportedFormats = [
      "audio/flac",
      "audio/mp3",
      "audio/mpeg",
      "audio/mp4",
      "audio/m4a",
      "audio/ogg",
      "audio/wav",
      "audio/webm",
    ];

    const isValidFormat = supportedFormats.some(
      (format) => audioFile.type.startsWith(format) || audioFile.type.includes(format)
    );

    if (!isValidFormat) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_AUDIO_FORMAT",
          message: `Unsupported audio format: ${audioFile.type}. Supported formats: ${supportedFormats.join(", ")}`,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Initialize service with API keys from astro:env
    // Using astro:env ensures safe access in both local and Cloudflare environments
    const openaiApiKey = import.meta.env.OPENAI_API_KEY;
    const openrouterApiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!openaiApiKey || !openrouterApiKey) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "SERVICE_CONFIGURATION_ERROR",
          message: "API keys not configured on server. Please contact administrator.",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const transcriptionService = new AudioTranscriptionService({
      openaiApiKey,
      openrouterApiKey,
    });

    // Step 5: Get group context and verify membership
    let groupContext;
    try {
      groupContext = await transcriptionService.getGroupContext(locals.supabase, groupId, locals.user.id);
    } catch (error) {
      if (error instanceof GroupContextError) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "FORBIDDEN",
            message: "You are not an active member of this group",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error; // Re-throw unexpected errors
    }

    // Step 6: Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    });

    // Step 7: Process audio SYNCHRONICALLY (user will wait for result)
    const result = await transcriptionService.processAudio({
      audioBlob,
      groupContext,
      userId: locals.user.id,
    });

    const response: TranscriptionResultDTO = {
      transcription: result.transcription,
      expense_data: result.expenseData,
      confidence: result.expenseData.extraction_confidence ?? 0.5,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error types
    if (error instanceof ValidationError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: error.code,
          message: error.message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400, // Bad request for validation errors
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof TaskProcessingError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: error.code,
          message: error.message,
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
        message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
