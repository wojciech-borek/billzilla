/**
 * Chat API Validation Schemas
 *
 * Zod schemas for validating chat API requests and responses
 */

import { z } from "zod";

/**
 * Context information for chat requests
 */
export const chatContextSchema = z.object({
  timezone: z.string().optional(),
  language: z.enum(["pl", "en"]).optional(),
});

/**
 * Chat request schema for POST /api/chat
 */
export const chatRequestSchema = z.object({
  group_id: z.string().uuid("Invalid group ID format").nullable(),
  conversation_id: z.string().uuid("Invalid conversation ID format").nullable().optional(),
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long (max 2000 characters)"),
  context: chatContextSchema.optional(),
});

/**
 * Message type enum schema
 */
export const messageTypeSchema = z.enum([
  "user_text",
  "ai_text",
  "ai_function_call",
  "ai_function_result",
  "ai_error",
  "system_info",
]);

/**
 * Chat message metadata schema
 */
export const chatMessageMetadataSchema = z
  .object({
    functionName: z.string().optional(),
    isLoading: z.boolean().optional(),
    error: z.string().optional(),
  })
  .optional();

/**
 * Chat message schema
 */
export const chatMessageSchema = z.object({
  id: z.string(),
  type: messageTypeSchema,
  content: z.union([z.string(), z.record(z.unknown())]),
  timestamp: z.date(),
  metadata: chatMessageMetadataSchema,
});

/**
 * Rate limit info schema
 */
export const rateLimitInfoSchema = z.object({
  remaining: z.number().int().min(0),
  reset_at: z.string().datetime(),
});

/**
 * Chat response metadata schema
 */
export const chatResponseMetadataSchema = z.object({
  tokens_used: z.number().int().min(0),
  model: z.string(),
  function_calls_count: z.number().int().min(0),
  processing_time_ms: z.number().int().min(0),
});

/**
 * Chat response schema for POST /api/chat
 */
export const chatResponseSchema = z.object({
  conversation_id: z.string().uuid(),
  messages: z.array(chatMessageSchema),
  metadata: chatResponseMetadataSchema,
  rate_limit: rateLimitInfoSchema,
});

// Type exports
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatContext = z.infer<typeof chatContextSchema>;
export type MessageType = z.infer<typeof messageTypeSchema>;
export type ChatMessageMetadata = z.infer<typeof chatMessageMetadataSchema>;
export type RateLimitInfo = z.infer<typeof rateLimitInfoSchema>;
export type ChatResponseMetadata = z.infer<typeof chatResponseMetadataSchema>;
