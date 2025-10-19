/**
 * Zod validation schemas for expense-related operations
 */

import { z } from "zod";

/**
 * Schema for a single expense split
 * Validates that each split has a valid profile_id and positive amount
 */
export const expenseSplitCommandSchema = z.object({
  profile_id: z.string().uuid("Invalid profile ID format"),
  amount: z
    .number()
    .positive("Split amount must be positive")
    .refine(
      (val) => {
        // Check max 2 decimal places
        const decimalPlaces = (val.toString().split(".")[1] || "").length;
        return decimalPlaces <= 2;
      },
      { message: "Amount must have at most 2 decimal places" }
    ),
});

/**
 * Schema for creating a new expense
 * Validates all required fields and enforces business rules:
 * - Description length: 1-500 characters
 * - Amount: positive with max 2 decimal places
 * - Currency: ISO 4217 format (3 uppercase letters)
 * - Expense date: valid ISO 8601 date string
 * - Splits: non-empty array with sum equal to total amount (±0.01 tolerance)
 * - No duplicate profile_ids in splits
 */
export const createExpenseSchema = z
  .object({
    description: z
      .string()
      .min(1, "Description is required")
      .max(500, "Description must not exceed 500 characters")
      .trim(),
    amount: z
      .number()
      .positive("Amount must be positive")
      .refine(
        (val) => {
          const decimalPlaces = (val.toString().split(".")[1] || "").length;
          return decimalPlaces <= 2;
        },
        { message: "Amount must have at most 2 decimal places" }
      ),
    currency_code: z
      .string()
      .length(3, "Currency code must be exactly 3 characters")
      .regex(/^[A-Z]{3}$/, "Currency code must be 3 uppercase letters (ISO 4217 format)")
      .trim(),
    expense_date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/,
        "Invalid date format. Expected YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS format"
      ),
    payer_id: z.string().uuid("Invalid payer ID format"),
    splits: z.array(expenseSplitCommandSchema).min(1, "At least one split is required"),
  })
  .refine(
    (data) => {
      // Check that sum of splits equals total amount (with ±0.01 tolerance)
      const splitsSum = data.splits.reduce((sum, split) => sum + split.amount, 0);
      const difference = Math.abs(splitsSum - data.amount);
      return difference <= 0.01;
    },
    {
      message: "Sum of splits must equal the total amount (tolerance ±0.01)",
      path: ["splits"],
    }
  )
  .refine(
    (data) => {
      // Check for duplicate profile_ids in splits
      const profileIds = data.splits.map((split) => split.profile_id);
      const uniqueProfileIds = new Set(profileIds);
      return profileIds.length === uniqueProfileIds.size;
    },
    {
      message: "Duplicate profile_id found in splits. Each participant can only appear once",
      path: ["splits"],
    }
  );

/**
 * Type inference for CreateExpenseCommand from schema
 */
export type CreateExpenseSchemaType = z.infer<typeof createExpenseSchema>;

// ============================================================================
// Frontend Schemas (Form validation - Polish messages)
// ============================================================================

/**
 * Schema for expense form validation (Frontend)
 * Polish messages for better UX
 * Uses optional fields to avoid showing errors on empty form
 */
export const createExpenseFormSchema = z
  .object({
    description: z
      .string()
      .optional()
      .refine((val) => !val || (val.trim().length >= 1 && val.trim().length <= 500), {
        message: "Opis wydatku jest wymagany (1-500 znaków)",
      }),
    amount: z
      .number()
      .optional()
      .refine(
        (val) => val === undefined || val === null || (val > 0 && (val.toString().split(".")[1] || "").length <= 2),
        {
          message: "Kwota musi być większa od zera i mieć maksymalnie 2 miejsca po przecinku",
        }
      ),
    currency_code: z
      .string()
      .optional()
      .refine((val) => !val || (val.length === 3 && /^[A-Z]{3}$/.test(val)), {
        message: "Kod waluty musi składać się z 3 wielkich liter (ISO 4217 format)",
      }),
    expense_date: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(val), {
        message: "Nieprawidłowy format daty. Oczekiwany format YYYY-MM-DDTHH:MM lub YYYY-MM-DDTHH:MM:SS",
      }),
    payer_id: z
      .string()
      .optional()
      .refine((val) => !val || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val), {
        message: "Nieprawidłowy identyfikator płatnika",
      }),
    splits: z
      .array(
        z.object({
          profile_id: z.string().uuid("Nieprawidłowy identyfikator uczestnika"),
          amount: z
            .number()
            .min(0, "Kwota podziału nie może być ujemna")
            .refine(
              (val) => {
                const decimalPlaces = (val.toString().split(".")[1] || "").length;
                return decimalPlaces <= 2;
              },
              { message: "Kwota może mieć maksymalnie 2 miejsca po przecinku" }
            ),
        })
      )
      .default([]),
  })
  // Note: Sum validation and duplicates check are handled in the form hook, not in schema
  .refine(
    (data) => {
      // Check for duplicate profile_ids in splits (only if there are splits)
      if (!data.splits || data.splits.length === 0) return true;
      const profileIds = data.splits.map((split) => split.profile_id);
      const uniqueProfileIds = new Set(profileIds);
      return profileIds.length === uniqueProfileIds.size;
    },
    {
      message: "Duplikat uczestnika znaleziony w podziałach. Każdy uczestnik może pojawić się tylko raz",
      path: ["splits"],
    }
  );

/**
 * TypeScript type for expense form values (Frontend)
 */
export type CreateExpenseFormValues = z.infer<typeof createExpenseFormSchema>;
