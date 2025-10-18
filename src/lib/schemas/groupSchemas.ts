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

