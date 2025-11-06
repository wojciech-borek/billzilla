import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { BalancesDTO } from "../../types";
import { createClient } from "../../db/supabase.client";

interface UseGroupBalancesOptions {
  enabled?: boolean;
}

interface UseGroupBalancesReturn {
  balances: BalancesDTO | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for fetching group balances and settlement suggestions
 */
export function useGroupBalances(
  groupId: string,
  options: UseGroupBalancesOptions = {},
  queryOptions?: Partial<UseQueryOptions<BalancesDTO>>
): UseGroupBalancesReturn {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: ["group", groupId, "balances"],
    queryFn: async (): Promise<BalancesDTO> => {
      // Pobierz access token z Supabase
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/groups/${groupId}/balances`, {
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return await response.json();
    },
    enabled: enabled && !!groupId,
    staleTime: 0, // Don't cache balances - they can change frequently
    gcTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Force refetch on mount to get fresh data
    ...queryOptions,
  });

  // Removed duplicate refetch logic - now using refetchOnMount: true

  return {
    balances: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
