import { z } from "zod";

/**
 * Schema for creating a new settlement
 */
export const createSettlementSchema = z.object({
  payer_id: z.string().uuid("Invalid payer ID"),
  payee_id: z.string().uuid("Invalid payee ID"),
  amount: z.number().positive("Amount must be positive").max(1000000, "Amount too large"),
}).refine((data) => data.payer_id !== data.payee_id, {
  message: "Payer and payee cannot be the same person",
  path: ["payee_id"],
});

/**
 * Schema for listing settlements query parameters
 */
export const listSettlementsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sort: z.enum(["date_desc", "date_asc"]).optional().default("date_desc"),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
export type ListSettlementsQuery = z.infer<typeof listSettlementsQuerySchema>;
