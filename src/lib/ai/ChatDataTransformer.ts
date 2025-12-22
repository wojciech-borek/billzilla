/**
 * ChatDataTransformer
 *
 * Transforms raw function results from the AI tools into structured data
 * expected by the SmartCard components (MetricCard, DataTableCard, ChartCard).
 */

import type { FunctionName } from "./chatTypes";
import type { DataTableCardData } from "@/components/chat/cards/DataTableCard";
import type { MetricCardData } from "@/components/chat/cards/MetricCard";

// Specific types for raw function results
interface RawUserGroup {
  id: string;
  name: string;
  role: string;
  my_balance: number;
  base_currency_code: string;
}

interface RawUserGroups {
  groups?: RawUserGroup[];
  total?: number;
  error?: string;
}

interface RawMemberBalance {
  profile_id: string;
  full_name?: string;
  balance: number;
  avatar_url?: string;
}

interface RawMemberBalances {
  member_balances?: RawMemberBalance[];
  base_currency_code?: string;
  error?: string;
}

interface RawExpensesSummary {
  period?: { start: string; end: string };
  total?: number;
  currency?: string;
  member_breakdown?: { name: string; total: number }[];
  error?: string;
}

/**
 * Transforms list_user_groups result into DataTableCardData
 */
function transformUserGroups(data: RawUserGroups): DataTableCardData {
  const groups = data.groups || [];

  return {
    title: "Twoje Grupy",
    badge: {
      label: "Razem",
      value: data.total || 0,
    },
    columns: [
      { key: "main", label: "Nazwa grupy" },
      { key: "role", label: "Rola" },
      { key: "balance", label: "Twoje saldo", align: "right" },
    ],
    rows: groups.map((g) => ({
      id: g.id,
      data: {
        main: g.name,
        role: g.role === "creator" ? "Twórca" : "Członek",
        balance: `${g.my_balance.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} ${g.base_currency_code}`,
      },
      onClick: () => {
        window.location.href = `/groups/${g.id}`;
      },
    })),
    emptyMessage: "Nie należysz jeszcze do żadnej grupy.",
  };
}

/**
 * Transforms get_member_balances into DataTableCardData
 */
function transformMemberBalances(data: RawMemberBalances): DataTableCardData {
  const balances = data.member_balances || [];

  return {
    title: "Salda Członków",
    badge: {
      label: "Waluta",
      value: data.base_currency_code || "PLN",
    },
    columns: [
      { key: "main", label: "Osoba" },
      { key: "balance", label: "Bilans", align: "right" },
    ],
    rows: balances.map((b) => ({
      id: b.profile_id,
      data: {
        main: b.full_name || "Nieznany",
        balance: `${b.balance.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} ${data.base_currency_code}`,
      },
      avatar: {
        url: b.avatar_url,
        fallback: (b.full_name || "?").substring(0, 2).toUpperCase(),
      },
    })),
  };
}

/**
 * Transforms get_expenses_summary into MetricCardData
 */
function transformExpensesSummary(data: RawExpensesSummary): MetricCardData {
  return {
    title: "Podsumowanie Wydatków",
    subtitle: `${data.period?.start} - ${data.period?.end}`,
    metric: {
      label: "Suma wydatków",
      value: data.total || 0,
      currency: data.currency || "PLN",
    },
    breakdown: data.member_breakdown
      ? {
          label: "Podział na osoby",
          items: data.member_breakdown.map((m) => ({
            name: m.name,
            value: m.total,
            currency: data.currency || "PLN",
          })),
        }
      : undefined,
  };
}

/**
 * Main entry point for transformation
 */
export function transformChatData(functionName: FunctionName, rawData: unknown): unknown {
  if (!rawData || typeof rawData !== "object" || "error" in (rawData as Record<string, unknown>)) return rawData;

  switch (functionName) {
    case "list_user_groups":
      return transformUserGroups(rawData as RawUserGroups);
    case "get_member_balances":
      return transformMemberBalances(rawData as RawMemberBalances);
    case "get_expenses_summary":
      return transformExpensesSummary(rawData as RawExpensesSummary);
    // Add more mappers as needed
    default:
      return rawData;
  }
}

// Deprecated class wrapper for backward compatibility if needed,
// but we should ideally update callers to use transformChatData.
// Given no-extraneous-class, we use a constant object instead if we want to keep the name.
export const ChatDataTransformer = {
  transform: transformChatData,
};
