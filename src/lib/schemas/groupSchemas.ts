/**
 * Zod validation schemas for group-related API endpoints
 */

import { z } from 'zod';

/**
 * Schema for creating a new group
 * Used in: POST /api/groups
 */
export const createGroupSchema = z.object({
  name: z.string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must not exceed 100 characters')
    .trim(),
  
  base_currency_code: z.string()
    .length(3, 'Currency code must be exactly 3 characters')
    .toUpperCase(),
  
  invite_emails: z.array(
    z.string()
      .email('Invalid email address')
      .toLowerCase()
  )
    .max(20, 'Cannot invite more than 20 people at once')
    .optional()
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

/**
 * Schema for listing groups query parameters
 * Used in: GET /api/groups
 */
export const listGroupsQuerySchema = z.object({
  status: z.enum(['active', 'archived']).default('active').optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional()
});

export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;

