import { describe, it, expect, beforeEach, vi } from "vitest";
import type { APIContext } from "astro";
import { POST } from "@/pages/api/chat/index";
import { ChatService } from "@/lib/services/ai/ChatService";

// Mock ChatService
vi.mock("@/lib/services/ai/ChatService", () => {
  return {
    ChatService: vi.fn().mockImplementation(() => ({
      processChatMessage: vi.fn(),
    })),
    ChatServiceError: class extends Error {
      constructor(
        public message: string,
        public code: string,
        public statusCode: number
      ) {
        super(message);
      }
    },
  };
});

// Mock environment variables
vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");

describe("POST /api/chat", () => {
  let mockContext: Partial<APIContext>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      request: new Request("http://localhost/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group_id: "550e8400-e29b-41d4-a716-446655440000",
          message: "Show my groups",
          context: {
            timezone: "Europe/Warsaw",
            language: "pl",
          },
        }),
      }),
      locals: {
        user: {
          id: "user-123",
          email: "test@example.com",
        },
        supabase: {} as any,
      },
    } as any;
  });

  it("should return 401 when user is not authenticated", async () => {
    // Arrange
    if (mockContext.locals) {
      mockContext.locals.user = null;
    }

    // Act
    const response = await POST(mockContext as APIContext);

    // Assert
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 400 when request body is invalid", async () => {
    // Arrange
    mockContext.request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // missing group_id or message
      }),
    });

    // Act
    const response = await POST(mockContext as APIContext);

    // Assert
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 200 and chat response when successful", async () => {
    // Arrange
    const mockChatResponse = {
      conversation_id: "550e8400-e29b-41d4-a716-446655440001",
      messages: [],
      metadata: {
        tokens_used: 100,
        model: "test-model",
        function_calls_count: 0,
        processing_time_ms: 50,
      },
      rate_limit: {
        remaining: 99,
        reset_at: new Date().toISOString(),
      },
    };

    const mockProcessChatMessage = vi.fn().mockResolvedValue(mockChatResponse);
    vi.mocked(ChatService).mockImplementation(function () {
      return {
        processChatMessage: mockProcessChatMessage,
      } as any;
    });

    // Act
    const response = await POST(mockContext as APIContext);

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockChatResponse);
    expect(mockProcessChatMessage).toHaveBeenCalledWith({
      userId: "user-123",
      groupId: "550e8400-e29b-41d4-a716-446655440000",
      conversationId: undefined,
      message: "Show my groups",
      context: {
        timezone: "Europe/Warsaw",
        language: "pl",
      },
    });
  });

  it("should handle ChatServiceError and return appropriate status code", async () => {
    // Arrange
    const { ChatServiceError } = await import("@/lib/services/ai/ChatService");
    const error = new ChatServiceError("Rate limit exceeded", "RATE_LIMIT_ERROR", 429);

    vi.mocked(ChatService).mockImplementation(function () {
      return {
        processChatMessage: vi.fn().mockRejectedValue(error),
      } as any;
    });

    // Act
    const response = await POST(mockContext as APIContext);

    // Assert
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error.code).toBe("RATE_LIMIT_ERROR");
  });
});
