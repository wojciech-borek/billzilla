/**
 * Zod validation schemas for currency operations
 */

import { z } from "zod";

/**
 * Schema for adding a new currency to a group
 * Used in: POST /api/groups/:groupId/currencies
 */
export const addCurrencySchema = z.object({
  currency_code: z
    .string()
    .length(3, "Currency code is required and must be exactly 3 characters")
    .regex(/^[A-Z]{3}$/, "Currency code must be 3 uppercase letters")
    .trim(),
  exchange_rate: z
    .number()
    .positive("Exchange rate is required and must be greater than 0")
    .min(0.0001, "Exchange rate must be at least 0.0001")
    .max(9999.9999, "Exchange rate must not exceed 9999.9999")
    .refine((val) => {
      // Check if the number has at most 4 decimal places
      const decimalPlaces = (val.toString().split(".")[1] || "").length;
      return decimalPlaces <= 4;
    }, "Exchange rate can have at most 4 decimal places"),
});

/**
 * Schema for updating a currency's exchange rate
 * Used in: PATCH /api/groups/:groupId/currencies/:code
 */
export const updateCurrencySchema = z.object({
  exchange_rate: z
    .number()
    .positive("Exchange rate is required and must be greater than 0")
    .min(0.0001, "Exchange rate must be at least 0.0001")
    .max(9999.9999, "Exchange rate must not exceed 9999.9999")
    .refine((val) => {
      // Check if the number has at most 4 decimal places
      const decimalPlaces = (val.toString().split(".")[1] || "").length;
      return decimalPlaces <= 4;
    }, "Exchange rate can have at most 4 decimal places"),
});

/**
 * Type inference from schemas
 */
export type AddCurrencyInput = z.infer<typeof addCurrencySchema>;
export type UpdateCurrencyInput = z.infer<typeof updateCurrencySchema>;
