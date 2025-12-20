/**
 * Chat Types for AI Assistant
 *
 * Type definitions for chat messages, function calls, and component mapping
 */

/**
 * Possible message types in the chat
 */
export type MessageType =
  | "user_text" // Regular user text message
  | "ai_text" // AI text response (with optional markdown)
  | "ai_function_call" // AI is calling a function → show what it's doing
  | "ai_function_result" // Function result → render SmartCard
  | "ai_error" // AI or API error
  | "system_info"; // System information (e.g., rate limits)

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string | object; // string for text, object for function results
  timestamp: Date;
  metadata?: {
    functionName?: string; // name of called function (for debugging)
    isLoading?: boolean; // whether loading is in progress
    error?: string; // error message
  };
}

/**
 * Function names that AI can call
 */
export type FunctionName =
  // Specialized high-level tools
  | "get_member_balances"
  | "get_expenses_summary"
  | "search_expenses"
  | "analyze_spending_trends"
  | "get_top_expenses"
  | "get_member_statistics"
  | "generate_group_report"
  // Generic low-level tools
  | "get_expenses"
  | "get_members"
  | "get_group_metadata"
  | "list_user_groups"
  // Utility functions
  | "get_group_context"
  | "get_currency_exchange_rates";

/**
 * Card types for universal SmartCards
 */
export type SmartCardType = "metric" | "data_table" | "chart";

/**
 * Import card data types
 */
export type { MetricCardData } from "@/components/chat/cards/MetricCard";
export type { DataTableCardData } from "@/components/chat/cards/DataTableCard";
export type { ChartCardData } from "@/components/chat/cards/ChartCard";

/**
 * Chat API Request/Response Types
 */

/**
 * Context information for chat requests
 */
export interface ChatContext {
  timezone?: string;
  language?: "pl" | "en";
}

/**
 * Chat API request structure
 */
export interface ChatRequest {
  group_id: string | null;
  conversation_id?: string;
  message: string;
  context?: ChatContext;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  remaining: number;
  reset_at: string;
}

/**
 * Chat response metadata
 */
export interface ChatResponseMetadata {
  tokens_used: number;
  model: string;
  function_calls_count: number;
  processing_time_ms: number;
}

/**
 * Chat API response structure
 */
export interface ChatResponse {
  conversation_id: string;
  messages: ChatMessage[];
  metadata: ChatResponseMetadata;
  rate_limit: RateLimitInfo;
}

/**
 * Conversation metadata
 */
export interface ConversationMetadata {
  id: string;
  user_id: string;
  group_id: string | null;
  created_at: Date;
  updated_at: Date;
}
