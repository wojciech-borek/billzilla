import type { APIRoute } from "astro";
import type { ErrorResponseDTO } from "../../../../types";
import { groupIdParamSchema } from "../../../../lib/schemas/groupSchemas";
import { archiveGroup } from "../../../../lib/services/groupService";
import { GroupAccessError, GroupDataError, GroupNotCreatorError } from "../../../../lib/services/errors/groupErrors";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

const respondWithError = (status: number, code: string, message: string): Response => {
  const payload: ErrorResponseDTO = {
    error: {
      code,
      message,
    },
  };

  return new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders,
  });
};

export const POST: APIRoute = async ({ params, locals }) => {
  if (!locals?.user) {
    return respondWithError(401, "UNAUTHORIZED", "Authentication required");
  }

  const validation = groupIdParamSchema.safeParse({ groupId: params.groupId });
  if (!validation.success) {
    return respondWithError(400, "VALIDATION_ERROR", "Invalid group ID format");
  }

  try {
    const archivedGroup = await archiveGroup(locals.supabase, validation.data.groupId, locals.user.id);
    return new Response(JSON.stringify(archivedGroup), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (error) {
    if (error instanceof GroupNotCreatorError) {
      return respondWithError(403, "FORBIDDEN", error.message);
    }

    if (error instanceof GroupAccessError) {
      return respondWithError(404, "NOT_FOUND", error.message);
    }

    if (error instanceof GroupDataError) {
      return respondWithError(404, "NOT_FOUND", error.message);
    }

    console.error("Unexpected error archiving group:", error);
    return respondWithError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred while archiving the group");
  }
};
