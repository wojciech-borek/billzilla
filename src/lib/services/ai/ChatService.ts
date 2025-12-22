/**
 * Chat Service - Main Orchestrator
 *
 * Orchestrates the entire chat flow:
 * - Manages conversations
 * - Coordinates with OpenRouter for LLM responses
 * - Executes function calls via FunctionExecutor
 * - Applies security validations via SecurityGuard
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { ChatMessage, ChatResponse, ChatResponseMetadata, FunctionName } from "@/lib/ai/chatTypes";
import { ConversationRepository } from "@/lib/services/repositories/ConversationRepository";
import { OpenRouterService, type ChatMessage as OpenRouterMessage, type Tool } from "@/lib/services/openRouterService";
import { FunctionExecutor } from "@/lib/services/ai/FunctionExecutor";
import { SecurityGuard } from "@/lib/services/security/SecurityGuard";
import {
  createUserMessage,
  createAITextMessage,
  createFunctionCallMessage,
  createFunctionResultMessage,
  createErrorMessage,
} from "@/lib/ai/chatUtils";

/**
 * Chat service configuration
 */
export interface ChatServiceConfig {
  supabase: SupabaseClient;
  openRouterApiKey: string;
}

/**
 * Process chat message parameters
 */
export interface ProcessChatParams {
  userId: string;
  groupId: string | null;
  conversationId?: string;
  message: string;
  context?: {
    timezone?: string;
    language?: "pl" | "en";
  };
}

/**
 * Chat Service Error
 */
export class ChatServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 500
  ) {
    super(message);
    this.name = "ChatServiceError";
  }
}

/**
 * Main Chat Service
 */
export class ChatService {
  private readonly conversationRepo: ConversationRepository;
  private readonly openRouter: OpenRouterService;
  private readonly securityGuard: SecurityGuard;
  private readonly supabase: SupabaseClient;

  constructor(config: ChatServiceConfig) {
    this.supabase = config.supabase;
    this.conversationRepo = new ConversationRepository(config.supabase);
    this.openRouter = new OpenRouterService({ apiKey: config.openRouterApiKey });
    this.securityGuard = new SecurityGuard();
  }

  /**
   * Process a chat message and return response
   */
  async processChatMessage(params: ProcessChatParams): Promise<ChatResponse> {
    const startTime = Date.now();
    const { userId, groupId, conversationId, message } = params;

    try {
      // 1. Security: Analyze user message for prompt injection
      const promptAnalysis = this.securityGuard.analyzeUserMessage(message);
      if (promptAnalysis.isSuspicious) {
        throw new ChatServiceError(
          "Your message contains suspicious patterns. Please rephrase.",
          "SUSPICIOUS_MESSAGE",
          400
        );
      }

      // 2. Get or create conversation
      const conversation = conversationId
        ? await this.conversationRepo.getConversation(conversationId)
        : await this.conversationRepo.getOrCreateConversation(userId, groupId);

      if (!conversation) {
        throw new ChatServiceError("Conversation not found", "CONVERSATION_NOT_FOUND", 404);
      }

      // 3. Save user message
      const userMessage = createUserMessage(message);
      await this.conversationRepo.addMessage(conversation.id, userMessage);

      // 4. Get conversation history for context
      const history = await this.conversationRepo.getMessageHistory(conversation.id, 20);

      // Security: Analyze conversation history for multi-turn jailbreak attempts
      const historyAnalysis = this.securityGuard.analyzeConversation(history);
      if (historyAnalysis.isSuspicious) {
        throw new ChatServiceError(
          "Suspicious conversational pattern detected. Please stay within appropriate topics.",
          "SUSPICIOUS_CONVERSATION",
          400
        );
      }

      // 5. Prepare messages for OpenRouter
      const openRouterMessages = this.formatMessagesForOpenRouter(history);

      // 6. Get available tools
      const tools = this.getAvailableTools();

      // Security: Scan tool metadata for potential poisoning
      const toolAnalysis = this.securityGuard.analyzeToolMetadata(tools);
      if (toolAnalysis.isSuspicious) {
        // eslint-disable-next-line no-console
        console.error("[ChatService] Security alert: tool metadata poisoning detected", toolAnalysis.reason);
        throw new ChatServiceError(
          "A security issue was detected with the system configuration.",
          "TOOL_SECURITY_ALERT",
          500
        );
      }

      // 7. Function calling loop
      let iteration = 0;
      const MAX_ITERATIONS = 5;
      let totalTokens = 0;
      let functionCallsCount = 0;

      let llmResponse = await this.openRouter.chatCompletion({
        messages: openRouterMessages,
        tools,
        model: "anthropic/claude-3-haiku",
        temperature: 0.7,
      });

      totalTokens += llmResponse.usage.total_tokens;

      // Handle function calling loop
      while (llmResponse.choices[0]?.message?.tool_calls && iteration < MAX_ITERATIONS) {
        iteration++;
        const toolCalls = llmResponse.choices[0].message.tool_calls;
        const assistantMessage = llmResponse.choices[0].message;

        // 1. Add the assistant's tool call message to history
        openRouterMessages.push({
          role: "assistant",
          content: assistantMessage.content || "",
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: tc.type || "function",
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments || "{}",
            },
          })),
        });

        // 2. Process each tool call
        for (const toolCall of toolCalls) {
          functionCallsCount++;

          // Save function call message to DB (for UI display)
          const functionCallMsg = createFunctionCallMessage(toolCall.function.name as FunctionName);
          await this.conversationRepo.addMessage(conversation.id, functionCallMsg);

          // Parse arguments safely
          let functionArgs: Record<string, unknown> = {};
          try {
            if (toolCall.function.arguments && toolCall.function.arguments !== "undefined") {
              functionArgs = JSON.parse(toolCall.function.arguments);
            }
          } catch (_e) {
            // eslint-disable-next-line no-console
            console.warn(
              `[ChatService] Failed to parse arguments for ${toolCall.function.name}:`,
              toolCall.function.arguments
            );
          }

          // Security: Validate function call
          const validation = this.securityGuard.validateFunctionCall({
            userId,
            groupId,
            functionName: toolCall.function.name,
            functionArgs,
          });

          let functionResult;
          if (!validation.allowed) {
            functionResult = { success: false, error: validation.reason || "Function call not allowed" };
            const errorMsg = createErrorMessage(validation.reason || "Function call not allowed");
            await this.conversationRepo.addMessage(conversation.id, errorMsg);
          } else {
            // Sanitize and execute
            const sanitizedArgs = this.securityGuard.sanitizeArgs(functionArgs as Record<string, unknown>);
            const executor = new FunctionExecutor({ supabase: this.supabase, userId, groupId });
            functionResult = await executor.execute(toolCall.function.name as FunctionName, sanitizedArgs);
          }

          // Save function result to DB
          const resultMsg = createFunctionResultMessage(
            toolCall.function.name as FunctionName,
            (functionResult.data as Record<string, unknown>) || { error: functionResult.error }
          );
          await this.conversationRepo.addMessage(conversation.id, resultMsg);

          // Add tool result to OpenRouter messages
          openRouterMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResult.data || { error: functionResult.error }),
          });
        }

        // Call LLM again with function results
        llmResponse = await this.openRouter.chatCompletion({
          messages: openRouterMessages,
          tools,
          model: "anthropic/claude-3-haiku",
          temperature: 0.7,
        });

        totalTokens += llmResponse.usage.total_tokens;
      }

      // 8. Save final AI response
      const aiResponse = llmResponse.choices[0]?.message?.content || "I couldn't generate a response.";
      const aiMessage = createAITextMessage(aiResponse);
      await this.conversationRepo.addMessage(conversation.id, aiMessage);

      // 9. Get updated conversation history
      const updatedHistory = await this.conversationRepo.getMessageHistory(conversation.id, 50);

      // 10. Build response
      const processingTime = Date.now() - startTime;
      const metadata: ChatResponseMetadata = {
        tokens_used: totalTokens,
        model: llmResponse.model,
        function_calls_count: functionCallsCount,
        processing_time_ms: processingTime,
      };

      return {
        conversation_id: conversation.id,
        messages: updatedHistory,
        metadata,
        rate_limit: {
          remaining: 100, // TODO: Implement actual rate limiting
          reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof ChatServiceError) {
        throw error;
      }

      // Log unexpected errors
      // eslint-disable-next-line no-console
      console.error("[ChatService] Unexpected error:", error);

      throw new ChatServiceError("An unexpected error occurred while processing your message", "INTERNAL_ERROR", 500);
    }
  }

  /**
   * Format chat messages for OpenRouter API
   */
  private formatMessagesForOpenRouter(messages: ChatMessage[]): OpenRouterMessage[] {
    const formatted: OpenRouterMessage[] = [
      {
        role: "system",
        content: this.getSystemPrompt(),
      },
    ];

    for (const msg of messages) {
      if (msg.type === "user_text") {
        formatted.push({
          role: "user",
          content: msg.content as string,
        });
      } else if (msg.type === "ai_text") {
        formatted.push({
          role: "assistant",
          content: msg.content as string,
        });
      }
      // Function calls and results are handled separately in the loop
    }

    return formatted;
  }

  /**
   * Get system prompt for the AI
   */
  private getSystemPrompt(): string {
    const today = new Date().toISOString().split("T")[0];
    return `You are a helpful financial assistant for Billzilla, an expense management application.
Current Date: ${today}

Your role is to help users understand their group expenses and answer questions about their financial data.

You have access to tools to retrieve expense data, member balances, and search expenses. Use these tools to provide accurate and helpful responses.

Context and Tool Usage:
- Group-specific chat: You are locked to the current group. All tools will automatically use this group's context.
- Dashboard chat: You are in a global context. You MUST provide 'group_id' for group-specific tools. If the user refers to "my group" without specifying, call 'list_user_groups' first. If they have only one active group, use that ID automatically.

Guidelines:
- Always be polite and professional
- Provide clear, concise text answers
- Use the appropriate tools to fetch data
- Format monetary amounts with currency codes (e.g., 12.50 PLN)
- When showing dates, use a readable format
- If you're unsure about something, ask for clarification
- Respond in the same language as the user's question (Polish or English)
- Present data as simple text lists or summaries

Remember: You can only READ data, never modify or delete anything.`;
  }

  /**
   * Get available tools for function calling
   */
  private getAvailableTools(): Tool[] {
    const allowedFunctions = this.securityGuard.getAllowedFunctions();

    // Map function names to tool definitions
    // This would ideally come from a central schema definition
    return allowedFunctions.map((functionName) => ({
      type: "function" as const,
      function: {
        name: functionName,
        description: this.getFunctionDescription(functionName),
        parameters: this.getFunctionParameters(functionName),
      },
    }));
  }

  /**
   * Get function description
   */
  private getFunctionDescription(functionName: string): string {
    const descriptions: Record<string, string> = {
      get_member_balances: "Retrieves balance information between group members. Shows who owes whom and how much.",
      get_expenses_summary:
        "Aggregates group expenses for a specified time period. Returns total amount and optional breakdown per member.",
      search_expenses:
        "Searches for specific expenses based on keywords in description, date range, payer, or amount range.",
      get_expenses: "Fetches raw expense data from the group with pagination and optional filters.",
      get_members: "Retrieves the list of group members with basic information.",
      get_group_metadata:
        "Retrieves comprehensive group metadata including settings, currencies, creation date, and basic statistics.",
      list_user_groups:
        "Lists all groups that the user is a member of. Returns group names, roles, member counts, and balance information. Supports pagination and filtering by status (active/archived).",
      get_group_context:
        "Retrieves basic group information: name, members, primary currency, supported currencies, creation date.",
      get_currency_exchange_rates: "Returns current exchange rates for currencies used in the group.",
    };

    return descriptions[functionName] || "No description available";
  }

  /**
   * Get function parameters schema
   */
  private getFunctionParameters(functionName: string): Record<string, unknown> {
    // Simplified parameter schemas - in production, these should come from a central schema
    const baseParams = {
      type: "object",
      properties: {
        group_id: {
          type: "string",
          description: "The unique identifier of the group (UUID format)",
        },
      },
      required: ["group_id"],
    };

    // Add function-specific parameters
    const specificParams: Record<string, Record<string, unknown>> = {
      get_expenses_summary: {
        ...baseParams,
        properties: {
          ...baseParams.properties,
          start_date: { type: "string", format: "date", description: "Start date (YYYY-MM-DD)" },
          end_date: { type: "string", format: "date", description: "End date (YYYY-MM-DD)" },
          include_member_breakdown: { type: "boolean", description: "Include per-member breakdown" },
        },
      },
      search_expenses: {
        ...baseParams,
        properties: {
          ...baseParams.properties,
          keyword: {
            type: "string",
            description: "Search keyword. Use SINGULAR forms for better matching (e.g. 'zakup' instead of 'zakupy').",
          },
          start_date: { type: "string", format: "date" },
          end_date: { type: "string", format: "date" },
          payer_id: {
            type: "string",
            format: "uuid",
            description: "UUID of the payer to filter by. Do NOT invent UUIDs.",
          },
          own_expenses_only: {
            type: "boolean",
            description: "Set to true if user asks for 'my' expenses. Overrides payer_id.",
          },
          limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
        },
      },
      list_user_groups: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 50,
            description: "Maximum number of groups to return",
          },
          offset: {
            type: "integer",
            minimum: 0,
            default: 0,
            description: "Number of groups to skip (for pagination)",
          },
          status: {
            type: "string",
            enum: ["active", "archived"],
            description: "Filter groups by status (optional)",
          },
        },
        required: [],
      },
    };

    return specificParams[functionName] || baseParams;
  }
}
