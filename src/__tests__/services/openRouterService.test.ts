import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  OpenRouterService,
  ConfigurationError,
  OpenRouterApiError,
  NetworkError,
  InvalidJsonResponseError,
  ValidationError,
} from "../../lib/services/openRouterService";
import type { OpenRouterApiResponse } from "../../types";
import { z } from "zod";

// Helper functions for common test patterns
const setupServiceWithApiKey = (apiKey = "test-openrouter-key") => {
  return new OpenRouterService({ apiKey });
};

const mockFetchResponse = (response: Response) => {
  (global.fetch as any).mockResolvedValueOnce(response);
};

const createMockApiErrorResponse = (status = 400, message = "Bad Request") => ({
  ok: false,
  status,
  statusText: "Bad Request",
  json: () => Promise.resolve({ error: { message } }),
});

const createMockSuccessResponse = (data: unknown) => ({
  ok: true,
  json: () => Promise.resolve(data),
});

const createMockToolCallResponse = (extractedData: unknown): OpenRouterApiResponse => ({
  id: "chatcmpl-123",
  object: "chat.completion",
  created: 1677652288,
  model: "anthropic/claude-3-haiku",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            id: "call_123",
            type: "function",
            function: {
              name: "extract_expense_details",
              arguments: typeof extractedData === "string" ? extractedData : JSON.stringify(extractedData),
            } as { name: string; arguments: string },
          },
        ],
      },
      finish_reason: "tool_calls",
    },
  ],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
  },
});

describe("OpenRouterService", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    vi.restoreAllMocks();
    // Mock fetch globally for API tests
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize successfully when API key provided in config", () => {
      // Arrange
      const config = { apiKey: "test-openrouter-key" };

      // Act
      const service = new OpenRouterService(config);

      // Assert
      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it("should throw ConfigurationError when apiKey not provided", () => {
      // Arrange & Act & Assert
      expect(() => {
        new OpenRouterService();
      }).toThrow(ConfigurationError);
    });
  });

  describe("extractExpenseData", () => {
    let service: OpenRouterService;
    const testSchema = z.object({
      amount: z.number(),
      currency: z.string(),
      description: z.string(),
      category: z.string(),
      participants: z.array(z.string()),
    });

    beforeEach(() => {
      service = setupServiceWithApiKey();
    });

    it("should successfully extract expense data", async () => {
      // Arrange
      const transcription = "Pizza for 50 zł for me";
      const context = "Group context";
      const extractedData = {
        amount: 50.0,
        currency: "PLN",
        description: "Test expense",
        category: "food",
        participants: ["user1"],
      };
      const mockResponse = createMockToolCallResponse(extractedData);

      // @ts-expect-error - mock response for testing
      mockFetchResponse(createMockSuccessResponse(mockResponse));

      // Act
      const result = await service.extractExpenseData({
        transcription,
        context,
        schema: testSchema,
        model: "anthropic/claude-3-haiku",
        temperature: 0.1,
        maxTokens: 1024,
      });

      // Assert
      expect(result).toEqual(extractedData);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw OpenRouterApiError when API returns error", async () => {
      // Arrange
      const transcription = "Invalid transcription";
      const context = "Group context";

      // @ts-expect-error - mock response for testing
      mockFetchResponse(createMockApiErrorResponse(400, "Invalid request"));

      // Act & Assert
      await expect(
        service.extractExpenseData({
          transcription,
          context,
          schema: testSchema,
          model: "anthropic/claude-3-haiku",
        })
      ).rejects.toThrow(OpenRouterApiError);
    });

    it("should throw NetworkError when fetch fails", async () => {
      // Arrange
      const transcription = "Test transcription";
      const context = "Group context";

      (global.fetch as vi.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error("Network error"));

      // Act & Assert
      await expect(
        service.extractExpenseData({
          transcription,
          context,
          schema: testSchema,
          model: "anthropic/claude-3-haiku",
        })
      ).rejects.toThrow(NetworkError);
    });

    it("should throw InvalidJsonResponseError when response has invalid tool call arguments", async () => {
      // Arrange
      const transcription = "Test transcription";
      const context = "Group context";

      // Create response with tool_calls but invalid JSON in arguments
      const invalidExtractedData = "{ invalid json }";
      const mockResponse = createMockToolCallResponse(invalidExtractedData as any);

      // @ts-expect-error - mock response for testing
      mockFetchResponse(createMockSuccessResponse(mockResponse));

      // Act & Assert
      await expect(
        service.extractExpenseData({
          transcription,
          context,
          schema: testSchema,
          model: "anthropic/claude-3-haiku",
        })
      ).rejects.toThrow(InvalidJsonResponseError);
    });

    it("should throw ValidationError when response doesn't match schema", async () => {
      // Arrange
      const transcription = "Test transcription";
      const context = "Group context";

      // Invalid data that doesn't match the schema (missing required fields)
      const invalidExtractedData = {
        invalidField: "invalid",
        // missing required fields like amount, description, etc.
      };
      const mockResponse = createMockToolCallResponse(invalidExtractedData);

      // @ts-expect-error - mock response for testing
      mockFetchResponse(createMockSuccessResponse(mockResponse));

      // Act & Assert
      await expect(
        service.extractExpenseData({
          transcription,
          context,
          schema: testSchema,
          model: "anthropic/claude-3-haiku",
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("Request Configuration", () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = setupServiceWithApiKey();
    });

    it("should use correct API endpoint and headers", async () => {
      // Arrange
      const transcription = "Test transcription";
      const context = "Group context";
      const testSchema = z.object({ test: z.string() });

      // @ts-expect-error - mock response for testing
      mockFetchResponse(createMockSuccessResponse(createMockToolCallResponse({ test: "value" })));

      // Act
      await service.extractExpenseData({
        transcription,
        context,
        schema: testSchema,
        model: "anthropic/claude-3-haiku",
        temperature: 0.5,
        maxTokens: 500,
      });

      // Assert
      const fetchCall = (global.fetch as vi.MockedFunction<typeof fetch>).mock.calls[0];
      const [url, options] = fetchCall;

      expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
      expect(options?.method).toBe("POST");
      expect(options?.headers).toEqual({
        Authorization: "Bearer test-openrouter-key",
        "Content-Type": "application/json",
        "HTTP-Referer": expect.any(String),
        "X-Title": expect.any(String),
      });
    });

    it("should include correct request body", async () => {
      // Arrange
      const transcription = "Test transcription";
      const context = "Group context";
      const testSchema = z.object({ test: z.string() });

      // @ts-expect-error - mock response for testing
      mockFetchResponse(createMockSuccessResponse(createMockToolCallResponse({ test: "value" })));

      // Act
      await service.extractExpenseData({
        transcription,
        context,
        schema: testSchema,
        model: "anthropic/claude-3-haiku",
        temperature: 0.5,
        maxTokens: 500,
      });

      // Assert
      const fetchCall = (global.fetch as vi.MockedFunction<typeof fetch>).mock.calls[0];
      const [, options] = fetchCall;

      const body = JSON.parse(options?.body as string);
      expect(body).toEqual({
        model: "anthropic/claude-3-haiku",
        messages: expect.any(Array),
        temperature: 0.5,
        max_tokens: 500,
        tools: expect.any(Array),
        tool_choice: {
          type: "function",
          function: {
            name: "extract_expense_details",
          },
        },
      });
      expect(body.messages).toHaveLength(2); // System + user message
      expect(body.messages[0].role).toBe("system");
      expect(body.messages[1].role).toBe("user");
      expect(body.tools).toHaveLength(1);
      expect(body.tools[0].function.name).toBe("extract_expense_details");
    });
  });
});
