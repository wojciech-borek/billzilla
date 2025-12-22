/**
 * Chat Loading Text Mapping
 *
 * Maps function names to their loading text messages
 * Simplified for text-only chat (no visual cards)
 */

import type { FunctionName } from "./chatTypes";
import { CHAT_TEXTS } from "./chatTexts";

/**
 * Loading text mapping: Function name → Loading message
 */
export const LOADING_TEXT_MAP: Record<FunctionName, string> = {
  get_expenses_summary: CHAT_TEXTS.loadingStates.get_expenses_summary,
  get_member_balances: CHAT_TEXTS.loadingStates.get_member_balances,
  search_expenses: CHAT_TEXTS.loadingStates.search_expenses,
  get_expenses: CHAT_TEXTS.loadingStates.get_expenses,
  get_members: CHAT_TEXTS.loadingStates.get_members,
  get_group_metadata: CHAT_TEXTS.loadingStates.get_group_metadata,
  list_user_groups: CHAT_TEXTS.loadingStates.list_user_groups,
  get_group_context: CHAT_TEXTS.loadingStates.get_group_context,
  get_currency_exchange_rates: CHAT_TEXTS.loadingStates.get_currency_exchange_rates,
};

/**
 * Get loading text for a function
 */
export function getLoadingText(functionName: FunctionName): string {
  return LOADING_TEXT_MAP[functionName] || "Przetwarzam...";
}
