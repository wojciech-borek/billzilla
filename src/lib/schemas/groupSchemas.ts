/**
 * Zod validation schemas for group-related operations
 * Contains both backend (API) and frontend (form) schemas
 */

import { z } from "zod";

// ============================================================================
// Backend Schemas (API endpoints - English messages)
// ============================================================================

/**
 * Schema for creating a new group (Backend API)
 * Used in: POST /api/groups
 */
export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100, "Group name must not exceed 100 characters").trim(),

  base_currency_code: z.string().length(3, "Currency code must be exactly 3 characters").toUpperCase(),

  invite_emails: z
    .array(z.string().email("Invalid email address").toLowerCase())
    .max(20, "Cannot invite more than 20 people at once")
    .optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

/**
 * Schema for listing groups query parameters
 * Used in: GET /api/groups
 */
export const listGroupsQuerySchema = z.object({
  status: z.enum(["active", "archived"]).default("active").optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;

// ============================================================================
// Frontend Schemas (Form validation - Polish messages)
// ============================================================================

/**
 * Email validation regex (RFC 5322 simplified)
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Schema for Create Group form validation (Frontend)
 * Polish messages for better UX
 */
export const createGroupFormSchema = z.object({
  name: z.string().min(1, "Nazwa grupy jest wymagana").max(100, "Nazwa grupy może mieć maksymalnie 100 znaków").trim(),

  base_currency_code: z
    .string()
    .length(3, "Kod waluty musi mieć dokładnie 3 znaki")
    .regex(/^[A-Z]{3}$/, "Kod waluty musi składać się z 3 wielkich liter")
    .default("PLN"),

  invite_emails: z
    .array(
      z
        .string()
        .email("Nieprawidłowy adres e-mail")
        .regex(emailRegex, "Nieprawidłowy format adresu e-mail")
        .trim()
        .toLowerCase()
    )
    .max(20, "Możesz zaprosić maksymalnie 20 osób")
    .optional()
    .default([])
    .refine(
      (emails) => {
        // Check for uniqueness (case-insensitive)
        const uniqueEmails = new Set(emails.map((email) => email.toLowerCase()));
        return uniqueEmails.size === emails.length;
      },
      {
        message: "Adresy e-mail muszą być unikalne",
      }
    ),
});

/**
 * TypeScript type for Create Group form values
 */
export type CreateGroupFormValues = z.infer<typeof createGroupFormSchema>;

// ============================================================================
// Frontend Types (UI-specific)
// ============================================================================

/**
 * Currency option for select dropdown
 */
export interface CurrencyOption {
  code: string;
  label: string;
  symbol?: string;
}

/**
 * Success result after group creation
 */
export interface CreateGroupSuccessResult {
  groupId: string;
  groupName: string;
  baseCurrency: string;
  invitations: {
    added_members: {
      profile_id: string;
      email: string;
      full_name: string | null;
      status: string;
    }[];
    created_invitations: {
      id: string;
      email: string;
      status: string;
    }[];
  };
}
