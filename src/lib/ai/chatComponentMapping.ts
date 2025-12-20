/**
 * Chat Component Mapping System
 *
 * Maps function names to their corresponding SmartCard components
 * HYBRID APPROACH: AI generates text + optional SmartCard for complex data
 */

import type { FunctionName } from "./chatTypes";
import type { ComponentType } from "react";
import { CHAT_TEXTS } from "./chatTexts";
import { lazy } from "react";

/**
 * Component mapping configuration
 */
export interface ComponentMapping {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  loadingText: string;
  cardType: "metric" | "data_table" | "chart" | "none";
  errorFallback?: string;
}

/**
 * Lazy-loaded Universal SmartCard components
 */
const MetricCard = lazy(() => import("@/components/chat/cards/MetricCard"));
const DataTableCard = lazy(() => import("@/components/chat/cards/DataTableCard"));
const ChartCard = lazy(() => import("@/components/chat/cards/ChartCard"));

/**
 * No-op component for functions that don't need a visual card
 * AI will generate text-only responses for these
 */
const NoCard = () => null;

/**
 * Main mapping object: Function name → Component + metadata
 *
 * STRATEGY:
 * - cardType 'none' = AI generates only text (simple queries)
 * - cardType 'metric' | 'data_table' | 'chart' = Show SmartCard + AI commentary
 */
export const CHAT_COMPONENT_MAP: Record<FunctionName, ComponentMapping> = {
  // Complex data → Metric Card
  get_expenses_summary: {
    component: MetricCard,
    cardType: "metric",
    loadingText: CHAT_TEXTS.loadingStates.get_expenses_summary,
    errorFallback: "Nie mogę pobrać podsumowania wydatków.",
  },

  // Lists/Tables → DataTable Card
  get_member_balances: {
    component: DataTableCard,
    cardType: "data_table",
    loadingText: CHAT_TEXTS.loadingStates.get_member_balances,
    errorFallback: "Nie mogę pobrać sald. Spróbuj ponownie.",
  },

  search_expenses: {
    component: DataTableCard,
    cardType: "data_table",
    loadingText: CHAT_TEXTS.loadingStates.search_expenses,
    errorFallback: "Nie mogę wyszukać transakcji.",
  },

  // Charts/Trends → Chart Card
  analyze_spending_trends: {
    component: ChartCard,
    cardType: "chart",
    loadingText: CHAT_TEXTS.loadingStates.analyze_spending_trends,
    errorFallback: "Nie mogę przeanalizować trendów.",
  },

  // Simple queries → AI text only (no card)
  get_top_expenses: {
    component: DataTableCard,
    cardType: "data_table",
    loadingText: CHAT_TEXTS.loadingStates.get_top_expenses,
    errorFallback: "Nie mogę pobrać największych wydatków.",
  },

  get_member_statistics: {
    component: MetricCard,
    cardType: "metric",
    loadingText: CHAT_TEXTS.loadingStates.get_member_statistics,
    errorFallback: "Nie mogę pobrać statystyk członka.",
  },

  generate_group_report: {
    component: MetricCard,
    cardType: "metric",
    loadingText: CHAT_TEXTS.loadingStates.generate_group_report,
    errorFallback: "Nie mogę wygenerować raportu.",
  },

  // Generic Low-Level Tools (AI processes raw data, no card needed)
  get_expenses: {
    component: NoCard,
    cardType: "none",
    loadingText: CHAT_TEXTS.loadingStates.get_expenses,
    errorFallback: "Nie mogę pobrać danych o wydatkach.",
  },

  get_members: {
    component: NoCard,
    cardType: "none",
    loadingText: CHAT_TEXTS.loadingStates.get_members,
    errorFallback: "Nie mogę pobrać listy uczestników.",
  },

  get_group_metadata: {
    component: NoCard,
    cardType: "none",
    loadingText: CHAT_TEXTS.loadingStates.get_group_metadata,
    errorFallback: "Nie mogę pobrać metadanych grupy.",
  },

  list_user_groups: {
    component: DataTableCard,
    cardType: "data_table",
    loadingText: CHAT_TEXTS.loadingStates.list_user_groups,
    errorFallback: "Nie mogę pobrać listy Twoich grup.",
  },

  // Utility Functions (context/metadata, no card needed)
  get_group_context: {
    component: NoCard,
    cardType: "none",
    loadingText: CHAT_TEXTS.loadingStates.get_group_context,
    errorFallback: "Nie mogę pobrać informacji o grupie.",
  },

  get_currency_exchange_rates: {
    component: NoCard,
    cardType: "none",
    loadingText: CHAT_TEXTS.loadingStates.get_currency_exchange_rates,
    errorFallback: "Nie mogę pobrać kursów walut.",
  },
};

/**
 * Get component mapping for a function
 */
export function getComponentMapping(functionName: FunctionName): ComponentMapping | undefined {
  return CHAT_COMPONENT_MAP[functionName];
}

/**
 * Get loading text for a function
 */
export function getLoadingText(functionName: FunctionName): string {
  return CHAT_COMPONENT_MAP[functionName]?.loadingText || "Przetwarzam...";
}

/**
 * Check if a function has a SmartCard component
 */
export function hasSmartCard(functionName: string): functionName is FunctionName {
  const mapping = CHAT_COMPONENT_MAP[functionName as FunctionName];
  return !!mapping && mapping.cardType !== "none";
}

/**
 * Get card type for a function
 */
export function getCardType(functionName: FunctionName): "metric" | "data_table" | "chart" | "none" {
  return CHAT_COMPONENT_MAP[functionName]?.cardType || "none";
}
