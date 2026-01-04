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
      const systemPrompt = this.getSystemPrompt(conversation);
      const openRouterMessages: OpenRouterMessage[] = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...this.formatMessagesForOpenRouter(history),
      ];

      // 6. Get available tools
      const tools = this.getAvailableTools(conversation);

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
            // Use group_id from conversation (source of truth) instead of request params
            const executor = new FunctionExecutor({ supabase: this.supabase, userId, groupId: conversation.group_id });
            functionResult = await executor.execute(toolCall.function.name as FunctionName, sanitizedArgs);
          }

          // Function results are sent to LLM, not saved to DB (text-only chat)

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
    const formatted: OpenRouterMessage[] = [];

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
  private getSystemPrompt(conversation: { group_id: string | null }): string {
    const today = new Date().toISOString().split("T")[0];

    // Determine conversation context
    const contextInfo = conversation.group_id
      ? `You are in a GROUP-SPECIFIC conversation (group_id: ${conversation.group_id}).

**CRITICAL**: The system AUTOMATICALLY uses this group context for ALL function calls.
- DO NOT provide 'group_id' parameter when calling ANY function
- The backend will inject the group_id from this conversation context
- If you provide group_id anyway, it will be IGNORED in favor of the conversation context`
      : `You are in a DASHBOARD conversation (no specific group selected).

**CRITICAL**: You MUST explicitly provide 'group_id' for all group-related functions.

**WORKFLOW:**
1. If you don't have group UUIDs yet, call 'list_user_groups' first
2. The response contains 'id' field (UUID) and 'name' for each group
3. When user mentions a group by name or says "tam"/"there"/"w niej", use the UUID you received
4. If user has only ONE group, automatically use that group's UUID
5. NEVER invent or guess UUIDs - only use exact values from list_user_groups`;

    return `You are a helpful financial assistant for Billzilla, an expense management application.
Current Date: ${today}

**CONVERSATION CONTEXT:**
${contextInfo}

Your role is to help users understand their group expenses and answer questions about their financial data.

**TOOL USAGE POLICY:**
- You MUST ALWAYS use tools to answer user questions about data
- NEVER say "I don't know" or "I don't have access" or return empty responses without first calling the appropriate tool
- In dashboard mode: If you need group_id, AUTOMATICALLY call 'list_user_groups' first
- Chain tools intelligently and proactively
- Be smart about combining filters and functions

**DEFAULT THRESHOLDS & RANGES:**
- "Large expenses" / "duże wydatki": >= 200 PLN (unless user specifies otherwise)
- No date range specified: last 30 days from today
- "This week" / "w tym tygodniu": Monday to Sunday of current week (Europe/Warsaw timezone)
- "This month" / "w tym miesiącu": 1st to last day of current calendar month
- "Last month" / "ostatni miesiąc": 1st to last day of previous calendar month
- Always mention when you apply default thresholds: "Szukam wydatków powyżej 200 PLN (domyślny próg dla 'dużych wydatków')"

**CONVERSATION CONTINUITY (CRITICAL):**
If the user asks a follow-up question that clearly refers to the previous answer,
reuse the same filters and context (date range, category, person, group),
unless the user explicitly changes them.

DO NOT reuse context if:
- the new question introduces a new entity (different group/person/category)
- the previous query failed or returned no data
- reuse would materially change the meaning of the question

Examples:
User: "Ile wydaliśmy na jedzenie w grudniu?"
User: "A Jan?"
→ Interpret as: Jan + jedzenie + grudzień

User: "Wydatki w listopadzie"
User: "A transport?"
→ Interpret as: transport + listopad

**COMPREHENSIVE QUERY EXAMPLES:**

**1. BALANCES & SETTLEMENTS (kto komu jest winien)**
   User: "Kto mi ile ma oddać?"
   → Call get_member_balances()
   → Format who owes whom and amounts
   
   User: "Ile jestem winien Janowi?"
   → Call get_member_balances()
   → Find balance for specific person

**2. PERSON-SPECIFIC EXPENSES (wydatki konkretnej osoby)**
   User: "Ile wydał Jan?"
   → Step 1: Call get_members() to find Jan's profile_id
   → Step 2: Call get_expenses()
   → Step 3: Filter by payer_id matching Jan
   → Sum and respond
   
   User: "Pokaż wydatki opłacone przez Annę"
   → Same flow: get_members → get_expenses → filter

**NAME MATCHING RULES (CRITICAL):**
When user mentions a person by name (e.g., "Jan", "Anna", "Piotr"):
1. ALWAYS call get_members() first to get the full member list
2. Apply fuzzy matching in this order:
   - Level 1: Exact match (case-sensitive)
   - Level 2: Case-insensitive match
   - Level 3: Partial match (name contains or starts with)
   - Level 4: Fuzzy match (typos, accents)
3. If MULTIPLE matches found (>1 person):
   → Present candidates: "Znalazłem kilku członków: 1) Jan Kowalski (Założyciel, aktywny 2 dni temu), 2) Jan Nowak (Członek, aktywny miesiąc temu). Którego masz na myśli?"
   → Wait for clarification - DO NOT guess
4. If SINGLE match but uncertain (partial/fuzzy):
   → State assumption clearly: "Zakładam że chodzi o Jana Kowalskiego (Założyciel). Jeśli to nie ta osoba, daj znać."
5. If NO match:
   → "Nie znalazłem członka o imieniu 'X'. Dostępni członkowie: [lista]"

**INTENT RESOLUTION (WITH SAFEGUARDS):**
If the user's query is ambiguous:

- If confidence is HIGH (>80% based on phrasing and context):
  → Assume the most likely intent
  → Clearly state the assumption in the response

- If confidence is MEDIUM or LOW:
  → Ask a clarification question BEFORE calling tools

Examples:
"Ile wydał Jan?" → assume TOTAL (default for "ile")
"Wydatki Jana" → assume LIST

Always mention assumptions explicitly:
"Zakładam, że pytasz o sumę wydatków. Jeśli chcesz listę, daj znać."

**3. MY EXPENSES (moje wydatki)**
   User: "Ile ja wydałem?"
   → Call get_expenses()
   → Filter by payer_id matching current user
   → Sum and respond
   
   User: "Moje wydatki w grudniu"
   → get_expenses() with date filter
   → Filter by current user as payer

**4. AMOUNT-BASED QUERIES (po kwocie)**
   User: "Pokaż wydatki powyżej 100 zł"
   → Call get_expenses()
   → Filter by amount_in_base_currency >= 100
   
   User: "Jakie duże wydatki mieliśmy?"
   → get_expenses()
   → YOU decide threshold (e.g., > 200 PLN) and filter

**5. SEMANTIC/CATEGORY SEARCH (kategorie)**
   User: "Ile wydałem na jedzenie"
   → Call get_expenses()
   → YOU identify food-related: "obiad", "McDonald's", "pizzeria", "śniadanie", "kolacja"
   → Sum matching expenses
   
   User: "Wydatki na transport"
   → get_expenses()
   → Match: "uber", "taxi", "benzyna", "bilet", "parking"

**6. TIME-BASED QUERIES (po dacie)**
   User: "Wydatki w grudniu"
   → Call get_expenses_summary(start_date="2024-12-01", end_date="2024-12-31")
   OR get_expenses() with date filters
   
   User: "Ile wydaliśmy w tym tygodniu?"
   → Calculate date range for current week
   → Call get_expenses_summary() or get_expenses()

**7. LITERAL KEYWORD SEARCH (konkretne słowa)**
   User: "Znajdź wydatek na McDonald's"
   → Call search_expenses(keyword="McDonald")
   
   User: "Czy była płatność 'obiad'?"
   → search_expenses(keyword="obiad")

**8. COMPLEX COMBINATIONS (złożone zapytania)**
   User: "Ile Jan wydał na jedzenie w grudniu?"
   → Step 1: get_members() → find Jan's ID
   → Step 2: get_expenses() with date range
   → Step 3: Filter by payer_id = Jan AND semantic food matching
   → Sum and respond
   
   User: "Moje wydatki na transport powyżej 50 zł"
   → get_expenses()
   → Filter: payer = me AND semantic transport match AND amount > 50

**9. GROUP INFORMATION**
   User: "Kto jest w grupie?"
   → Call get_members()
   
   User: "Jaka jest waluta grupy?"
   → Call get_group_metadata() or get_group_context()

**10. USER'S GROUPS**
   User: "Jakie mam grupy?"
   → In dashboard: call list_user_groups()
   
   User: "Pokaż rozliczenia we wszystkich grupach"
   → list_user_groups() → for each group call get_member_balances()

**SEMANTIC SEARCH DETAILS (CRITICAL):**

**ALWAYS use get_expenses() for ANY category/type questions, even if they seem specific:**
- "jedzenie" (food) - general category
- "obiad" (lunch) - specific item BUT still a category/type of expense
- "transport" - general category
- "uber" - specific item BUT still treated as category query
- "rozrywka" - general category

**Understanding Synonyms and Subcategories:**
- When user asks "ile na jedzenie" then "ile na obiad" - these are RELATED
- "obiad", "śniadanie", "kolacja" are ALL types of "jedzenie"
- "uber", "taxi" are ALL types of "transport"
- "kino", "Netflix" are ALL types of "rozrywka"

**CONSISTENCY RULE:**
If you found expenses for "jedzenie" (food), and user then asks about "obiad" (lunch):
→ Use the SAME approach: get_expenses() + semantic filtering
→ "obiad" itself might appear as expense description
→ OR it might be implied by descriptions like "lunch", "obiad w restauracji", etc.
→ NEVER say "no other food expenses" if you already found food expenses!

**Semantic Category Examples:**
Food: "obiad", "śniadanie", "kolacja", "McDonald's", "KFC", "pizzeria", "restauracja", "zakupy spożywcze", "jedzenie", "lunch", "breakfast", "dinner"
Transport: "uber", "taxi", "benzyna", "bilet", "pociąg", "autobus", "parking", "metro", "transport", "bus", "train"
Entertainment: "kino", "koncert", "bar", "klub", "Netflix", "Spotify", "gra", "teatr", "rozrywka", "cinema", "movie"

**KEY PRINCIPLES:**
- ALWAYS fetch data with tools, never guess
- Chain functions when needed (e.g., get_members → get_expenses)
- Filter data yourself using semantic understanding
- Combine multiple filters for complex queries
- Format results in clear, user-friendly Polish/English text
- Be CONSISTENT: use same strategy for similar questions
- Understand context: "obiad" and "jedzenie" are related concepts

**IMPORTANT - Data Formatting:**
- After calling a tool, YOU MUST format the results as clear, readable TEXT in your response
- DO NOT just return raw data or empty strings - present it in a user-friendly way
- Use bullet points, numbered lists, or simple tables (using text formatting)
- Example: Instead of returning JSON, write: "Twoje grupy: 1. Wakacje (Założyciel, saldo: 0.00 PLN)"
- For complex queries, use this structure: (1) Summary sentence, (2) Key numbers, (3) Top 3-5 items
- For simple queries: direct answer without unnecessary structure

NEVER repeat raw tool output or API responses verbatim.
Always summarize, rephrase, and add user-facing context.

**EMPTY API RESPONSES (CRITICAL):**
If API returns empty list, no data, or error:
- NEVER return just "No results" or empty response
- ALWAYS explain WHY in user-friendly language:
  → "Nie znalazłem wydatków spełniających te kryteria (kategoria: jedzenie, okres: grudzień 2024)"
  → "Brak danych dla tego zakresu dat"
  → "Wystąpił błąd podczas pobierania danych. Spróbuj ponownie za chwilę."
- ALWAYS suggest helpful alternatives:
  → "Spróbuj rozszerzyć zakres dat (np. ostatnie 60 dni zamiast 30)"
  → "Sprawdź inne kategorie lub wszystkie wydatki"
  → "Upewnij się, że nazwa członka jest poprawna - dostępni członkowie: [lista]"
- For errors (500/403): Explain in simple terms and suggest retry or contact support

Guidelines:
- Always be polite and professional
- Provide clear, concise text answers
- Use the appropriate tools to fetch data, then format the results nicely
- Format monetary amounts with currency codes (e.g., 12.50 PLN)
- When showing dates, use a readable format (e.g., "22 grudnia 2024")
- If you're unsure about something, ask for clarification
- Respond in the same language as the user's question (Polish or English)
- Present data as simple text lists or summaries - NO fancy formatting needed

Remember: You can only READ data, never modify or delete anything.`;
  }

  /**
   * Get available tools for function calling
   */
  private getAvailableTools(conversation: { group_id: string | null }): Tool[] {
    const allowedFunctions = this.securityGuard.getAllowedFunctions();

    // Map function names to tool definitions
    // This would ideally come from a central schema definition
    return allowedFunctions.map((functionName) => ({
      type: "function" as const,
      function: {
        name: functionName,
        description: this.getFunctionDescription(functionName),
        parameters: this.getFunctionParameters(functionName, conversation),
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
        "Searches for expenses based on LITERAL keyword matching in description. Use only when user provides specific text that should appear in the description (e.g., 'find McDonald's expenses'). For semantic/category queries (e.g., 'food', 'transport'), use get_expenses instead and filter yourself.",
      get_expenses:
        "Fetches raw expense data with full descriptions. Use this for SEMANTIC/CATEGORY queries (e.g., 'food', 'transport', 'entertainment') where YOU need to analyze descriptions and filter based on meaning, not exact text match. Also supports date range and payer filters.",
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
  private getFunctionParameters(
    functionName: string,
    conversation: { group_id: string | null }
  ): Record<string, unknown> {
    // If conversation has group_id, make it optional (uses conversation context)
    // If dashboard conversation, make it required
    const hasGroupContext = conversation.group_id !== null;

    const baseParams = {
      type: "object",
      properties: {
        group_id: {
          type: "string",
          description: hasGroupContext
            ? "Optional - automatically uses conversation group context. Do not provide this parameter."
            : "Required - the unique identifier of the group (UUID format). Use list_user_groups to find available groups.",
        },
      },
      required: hasGroupContext ? [] : ["group_id"],
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

  /**
   * Get latest conversation history
   */
  async getLatestConversation(userId: string, groupId: string | null): Promise<ChatResponse> {
    const startTime = Date.now();

    // 1. Get or create conversation
    const conversation = await this.conversationRepo.getOrCreateConversation(userId, groupId);

    // 2. Get message history
    // Frontend limit: 50 messages
    const history = await this.conversationRepo.getMessageHistory(conversation.id, 50);

    // 3. Build response
    const processingTime = Date.now() - startTime;
    return {
      conversation_id: conversation.id,
      messages: history,
      metadata: {
        tokens_used: 0,
        model: "none",
        function_calls_count: 0,
        processing_time_ms: processingTime,
      },
      rate_limit: {
        remaining: 100,
        reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }
}
