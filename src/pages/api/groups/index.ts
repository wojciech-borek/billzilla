/**
 * API endpoint for groups
 * POST /api/groups - Create a new group
 */

import type { APIRoute } from 'astro';
import { createGroupSchema } from '../../../lib/schemas/groupSchemas';
import { createGroup, CurrencyNotFoundError, TransactionError } from '../../../lib/services/groupService';
import type { CreateGroupCommand, CreateGroupResponseDTO, ErrorResponseDTO } from '../../../types';

export const prerender = false;

/**
 * POST /api/groups
 * Creates a new billing group with the authenticated user as creator
 * 
 * Request body:
 * - name: string (1-100 chars)
 * - base_currency_code: string (3 chars)
 * - invite_emails: string[] (optional, max 20 emails)
 * 
 * Returns:
 * - 201: Group created successfully
 * - 400: Invalid request data
 * - 401: User not authenticated
 * - 422: Currency not found
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const user = locals.user;
    if (!user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to create a group'
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body'
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate with Zod schema
    const validationResult = createGroupSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validationResult.error.flatten()
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validatedData = validationResult.data;

    // Sanitize invite_emails
    let sanitizedEmails: string[] | undefined;
    if (validatedData.invite_emails && validatedData.invite_emails.length > 0) {
      // Remove duplicates, convert to lowercase, remove creator's own email
      const emailSet = new Set(
        validatedData.invite_emails
          .map(email => email.toLowerCase().trim())
          .filter(email => email !== user.email?.toLowerCase())
      );
      sanitizedEmails = Array.from(emailSet);
    }

    // Prepare command
    const command: CreateGroupCommand = {
      name: validatedData.name,
      base_currency_code: validatedData.base_currency_code,
      invite_emails: sanitizedEmails
    };

    // Call service to create group
    const supabase = locals.supabase;
    const result: CreateGroupResponseDTO = await createGroup(
      supabase,
      command,
      user.id
    );

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Handle specific errors
    if (error instanceof CurrencyNotFoundError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'CURRENCY_NOT_FOUND',
          message: error.message
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (error instanceof TransactionError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'TRANSACTION_ERROR',
          message: 'Failed to create group due to a database error',
          details: { originalError: error.message }
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle unexpected errors
    console.error('Unexpected error in POST /api/groups:', error);
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while creating the group'
      }
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

