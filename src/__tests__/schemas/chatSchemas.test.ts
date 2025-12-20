import { describe, it, expect } from "vitest";
import {
  chatRequestSchema,
  chatContextSchema,
  messageTypeSchema,
  chatMessageSchema,
  rateLimitInfoSchema,
  chatResponseMetadataSchema,
  chatResponseSchema,
} from "../../lib/schemas/chatSchemas";

describe("Chat Schemas", () => {
  describe("chatContextSchema", () => {
    it("should validate valid context", () => {
      const validContext = {
        timezone: "Europe/Warsaw",
        language: "pl" as const,
      };

      const result = chatContextSchema.safeParse(validContext);
      expect(result.success).toBe(true);
    });

    it("should accept empty context", () => {
      const result = chatContextSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should reject invalid language", () => {
      const invalidContext = {
        language: "fr", // Not in enum
      };

      const result = chatContextSchema.safeParse(invalidContext);
      expect(result.success).toBe(false);
    });
  });

  describe("chatRequestSchema", () => {
    it("should validate valid chat request", () => {
      const validRequest = {
        group_id: "550e8400-e29b-41d4-a716-446655440000",
        message: "Ile wydaliśmy w grudniu?",
        context: {
          timezone: "Europe/Warsaw",
          language: "pl" as const,
        },
      };

      const result = chatRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should validate request with conversation_id", () => {
      const validRequest = {
        group_id: "550e8400-e29b-41d4-a716-446655440000",
        conversation_id: "660e8400-e29b-41d4-a716-446655440001",
        message: "Pokaż więcej szczegółów",
      };

      const result = chatRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should reject empty message", () => {
      const invalidRequest = {
        group_id: "550e8400-e29b-41d4-a716-446655440000",
        message: "",
      };

      const result = chatRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cannot be empty");
      }
    });

    it("should reject message longer than 2000 characters", () => {
      const invalidRequest = {
        group_id: "550e8400-e29b-41d4-a716-446655440000",
        message: "a".repeat(2001),
      };

      const result = chatRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("too long");
      }
    });

    it("should reject invalid UUID for group_id", () => {
      const invalidRequest = {
        group_id: "not-a-uuid",
        message: "Test message",
      };

      const result = chatRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid group ID");
      }
    });

    it("should reject invalid UUID for conversation_id", () => {
      const invalidRequest = {
        group_id: "550e8400-e29b-41d4-a716-446655440000",
        conversation_id: "not-a-uuid",
        message: "Test message",
      };

      const result = chatRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid conversation ID");
      }
    });

    it("should reject missing required fields", () => {
      const invalidRequest = {
        group_id: "550e8400-e29b-41d4-a716-446655440000",
        // missing message
      };

      const result = chatRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe("messageTypeSchema", () => {
    it("should validate all message types", () => {
      const validTypes = ["user_text", "ai_text", "ai_function_call", "ai_function_result", "ai_error", "system_info"];

      validTypes.forEach((type) => {
        const result = messageTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid message type", () => {
      const result = messageTypeSchema.safeParse("invalid_type");
      expect(result.success).toBe(false);
    });
  });

  describe("chatMessageSchema", () => {
    it("should validate user text message", () => {
      const validMessage = {
        id: "msg-123",
        type: "user_text",
        content: "Test message",
        timestamp: new Date(),
      };

      const result = chatMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("should validate function result message with object content", () => {
      const validMessage = {
        id: "msg-456",
        type: "ai_function_result",
        content: {
          total: 3450.0,
          currency: "PLN",
        },
        timestamp: new Date(),
        metadata: {
          functionName: "get_expenses_summary",
        },
      };

      const result = chatMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("should validate message with loading metadata", () => {
      const validMessage = {
        id: "msg-789",
        type: "ai_function_call",
        content: "",
        timestamp: new Date(),
        metadata: {
          functionName: "get_member_balances",
          isLoading: true,
        },
      };

      const result = chatMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("should validate error message", () => {
      const validMessage = {
        id: "msg-error",
        type: "ai_error",
        content: "",
        timestamp: new Date(),
        metadata: {
          error: "Failed to process request",
        },
      };

      const result = chatMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });
  });

  describe("rateLimitInfoSchema", () => {
    it("should validate valid rate limit info", () => {
      const validInfo = {
        remaining: 87,
        reset_at: "2025-12-21T00:00:00Z",
      };

      const result = rateLimitInfoSchema.safeParse(validInfo);
      expect(result.success).toBe(true);
    });

    it("should reject negative remaining count", () => {
      const invalidInfo = {
        remaining: -1,
        reset_at: "2025-12-21T00:00:00Z",
      };

      const result = rateLimitInfoSchema.safeParse(invalidInfo);
      expect(result.success).toBe(false);
    });

    it("should reject invalid datetime format", () => {
      const invalidInfo = {
        remaining: 50,
        reset_at: "not-a-datetime",
      };

      const result = rateLimitInfoSchema.safeParse(invalidInfo);
      expect(result.success).toBe(false);
    });
  });

  describe("chatResponseMetadataSchema", () => {
    it("should validate valid metadata", () => {
      const validMetadata = {
        tokens_used: 450,
        model: "anthropic/claude-3-haiku",
        function_calls_count: 1,
        processing_time_ms: 2800,
      };

      const result = chatResponseMetadataSchema.safeParse(validMetadata);
      expect(result.success).toBe(true);
    });

    it("should reject negative values", () => {
      const invalidMetadata = {
        tokens_used: -10,
        model: "test-model",
        function_calls_count: 0,
        processing_time_ms: 1000,
      };

      const result = chatResponseMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });
  });

  describe("chatResponseSchema", () => {
    it("should validate complete chat response", () => {
      const validResponse = {
        conversation_id: "550e8400-e29b-41d4-a716-446655440000",
        messages: [
          {
            id: "msg-1",
            type: "user_text",
            content: "Test message",
            timestamp: new Date(),
          },
          {
            id: "msg-2",
            type: "ai_text",
            content: "AI response",
            timestamp: new Date(),
          },
        ],
        metadata: {
          tokens_used: 450,
          model: "anthropic/claude-3-haiku",
          function_calls_count: 1,
          processing_time_ms: 2800,
        },
        rate_limit: {
          remaining: 87,
          reset_at: "2025-12-21T00:00:00Z",
        },
      };

      const result = chatResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should reject invalid conversation_id", () => {
      const invalidResponse = {
        conversation_id: "not-a-uuid",
        messages: [],
        metadata: {
          tokens_used: 0,
          model: "test",
          function_calls_count: 0,
          processing_time_ms: 0,
        },
        rate_limit: {
          remaining: 100,
          reset_at: "2025-12-21T00:00:00Z",
        },
      };

      const result = chatResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });
});
