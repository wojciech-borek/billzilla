import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { PaginatedResponse, SettlementDTO } from "../../types";
import { createClient } from "../../db/supabase.client";

interface UseGroupSettlementsOptions {
  limit?: number;
  offset?: number;
  sort?: "date_desc" | "date_asc";
  enabled?: boolean;
}

interface UseGroupSettlementsReturn {
  settlements: SettlementDTO[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for fetching paginated settlements for a group
 */
export function useGroupSettlements(
  groupId: string,
  options: UseGroupSettlementsOptions = {},
  queryOptions?: Partial<UseQueryOptions<PaginatedResponse<SettlementDTO>>>
): UseGroupSettlementsReturn {
  const { limit = 50, offset = 0, sort = "date_desc", enabled = true } = options;

  const query = useQuery({
    queryKey: ["group", groupId, "settlements", { limit, offset, sort }],
    queryFn: async (): Promise<PaginatedResponse<SettlementDTO>> => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sort,
      });

      const response = await fetch(`/api/groups/${groupId}/settlements?${params}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
    enabled: enabled && !!groupId,
    staleTime: 30 * 1000, // 30 seconds
    ...queryOptions,
  });

  return {
    settlements: query.data?.data || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
