/**
 * API Endpoint: POST /api/expenses/transcribe
 * Creates a new audio transcription task for expense extraction
 *
 * This endpoint handles the asynchronous processing of audio files:
 * 1. Validates user authentication and group membership
 * 2. Validates audio file (format, size)
 * 3. Creates a transcription task in database
 * 4. Processes the task asynchronously (Whisper → LLM)
 * 5. Returns task ID for status polling
 */

import type { APIRoute } from "astro";
import type { ErrorResponseDTO, TranscribeTaskResponseDTO } from "../../../../types";
import {
  TranscriptionTaskService,
  TaskProcessingError,
  GroupContextError,
} from "../../../../lib/services/transcriptionTaskService";
import { z } from "zod";

export const prerender = false;

/**
 * POST /api/expenses/transcribe
 * Submits audio file for transcription and expense data extraction
 *
 * @requires Authentication - User must be logged in
 * @requires Membership - User must be an active member of the group
 * @requires Valid audio file - Max 25MB, supported formats
 *
 * @returns 201 - Task created and processing started
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
    } catch (error) {
      console.error("Failed to parse form data:", error);
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

    // Step 4: Initialize service
    const taskService = new TranscriptionTaskService();

    // Step 5: Get group context and verify membership
    let groupContext;
    try {
      groupContext = await taskService.getGroupContext(locals.supabase, groupId, locals.user.id);
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

    // Step 6: Create transcription task in database
    const task = await taskService.createTask(locals.supabase, {
      groupId,
      userId: locals.user.id,
    });

    // Step 7: Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    });

    // Step 8: Process task asynchronously (don't await - fire and forget)
    // The task will update its status in the database when done
    taskService
      .processTask(locals.supabase, {
        taskId: task.id,
        audioBlob,
        groupContext,
        userId: locals.user.id,
      })
      .catch((error) => {
        // Errors are already handled in processTask (updates task status to failed)
        // Just log for debugging
        console.error("Async task processing error:", error);
      });

    // Step 9: Return task response immediately
    const response: TranscribeTaskResponseDTO = {
      task_id: task.id,
      status: task.status as "processing",
      created_at: task.created_at,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/expenses/transcribe:", error);

    // Handle specific error types
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
