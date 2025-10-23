/**
 * API Endpoint: GET /api/expenses/transcribe/:taskId
 * Retrieves the status and result of a transcription task
 *
 * This endpoint allows clients to poll for task completion:
 * - Returns current status (processing, completed, failed)
 * - Returns transcription text and extracted data when completed
 * - Returns error details when failed
 */

import type { APIRoute } from "astro";
import type { ErrorResponseDTO, TranscribeTaskStatusDTO } from "../../../../types";
import { TranscriptionTaskService, TaskNotFoundError } from "../../../../lib/services/transcriptionTaskService";
import { z } from "zod";

export const prerender = false;

/**
 * GET /api/expenses/transcribe/:taskId
 * Retrieves the current status of a transcription task
 *
 * @requires Authentication - User must be logged in
 * @requires Ownership - User must be the owner of the task
 *
 * @returns 200 - Task status retrieved successfully
 * @returns 401 - Unauthorized (not authenticated)
 * @returns 404 - Task not found or access denied
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

    // Step 2: Extract taskId from params
    const { taskId } = params;

    // Guard clause: validate taskId exists
    if (!taskId) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "MISSING_TASK_ID",
          message: "Task ID is required",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const taskIdValidation = z.string().uuid();
    const validationResult = taskIdValidation.safeParse(taskId);

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_TASK_ID",
          message: "Invalid task ID format",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Initialize service and fetch task
    const taskService = new TranscriptionTaskService();

    let task;
    try {
      task = await taskService.getTask(locals.supabase, taskId, locals.user.id);
    } catch (error) {
      if (error instanceof TaskNotFoundError) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "NOT_FOUND",
            message: "Transcription task not found or access denied",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error; // Re-throw unexpected errors
    }

    // Step 4: Build response based on task status
    const response: TranscribeTaskStatusDTO = {
      task_id: task.id,
      status: task.status,
      created_at: task.created_at,
      completed_at: task.completed_at || undefined,
    };

    // Add result data if task is completed
    if (task.status === "completed" && task.result_data && task.transcription_text) {
      // Extract confidence from result_data or use default
      const resultData = task.result_data as any;
      const confidence = resultData?.extraction_confidence ?? 0.5; // Default to 0.5 if not available

      response.result = {
        transcription: task.transcription_text,
        expense_data: task.result_data as any,
        confidence,
      };
    }

    // Add error details if task failed
    if (task.status === "failed" && task.error_code && task.error_message) {
      response.error = {
        code: task.error_code,
        message: task.error_message,
      };
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/expenses/transcribe/:taskId:", error);

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
