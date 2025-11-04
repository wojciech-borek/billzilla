import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { UseQueryOptions, UseInfiniteQueryOptions } from "@tanstack/react-query";
import type { PaginatedResponse, ExpenseListItemDTO } from "../../types";

interface UseGroupExpensesOptions {
  limit?: number;
  offset?: number;
  sort?: "created_at" | "expense_date" | "amount";
  order?: "asc" | "desc";
  enabled?: boolean;
}

interface UseGroupExpensesReturn {
  expenses: ExpenseListItemDTO[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for fetching paginated expenses for a group
 */
export function useGroupExpenses(
  groupId: string,
  options: UseGroupExpensesOptions = {},
  queryOptions?: Partial<UseQueryOptions<PaginatedResponse<ExpenseListItemDTO>>>
): UseGroupExpensesReturn {
  const { limit = 20, offset = 0, sort = "created_at", order = "desc", enabled = true } = options;

  const query = useQuery({
    queryKey: ["group", groupId, "expenses", { limit, offset, sort, order }],
    queryFn: async (): Promise<PaginatedResponse<ExpenseListItemDTO>> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sort,
        order,
      });

      const response = await fetch(`/api/groups/${groupId}/expenses?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
    enabled: enabled && !!groupId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...queryOptions,
  });

  return {
    expenses: query.data?.data || [],
    total: query.data?.total || 0,
    hasMore: (query.data?.offset || 0) + (query.data?.data?.length || 0) < (query.data?.total || 0),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

interface UseInfiniteExpensesOptions {
  limit?: number;
  sort?: "created_at" | "expense_date" | "amount";
  order?: "asc" | "desc";
  enabled?: boolean;
}

interface UseInfiniteExpensesReturn {
  expenses: ExpenseListItemDTO[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  refetch: () => void;
}

/**
 * Hook for infinite scrolling expenses
 */
export function useInfiniteExpenses(
  groupId: string,
  options: UseInfiniteExpensesOptions = {},
  queryOptions?: Partial<UseInfiniteQueryOptions<PaginatedResponse<ExpenseListItemDTO>>>
): UseInfiniteExpensesReturn {
  const { limit = 20, sort = "created_at", order = "desc", enabled = true } = options;

  const query = useInfiniteQuery({
    queryKey: ["group", groupId, "expenses", "infinite", { limit, sort, order }],
    queryFn: async ({ pageParam = 0 }): Promise<PaginatedResponse<ExpenseListItemDTO>> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: pageParam.toString(),
        sort,
        order,
      });

      const response = await fetch(`/api/groups/${groupId}/expenses?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const loadedCount = lastPage.offset + lastPage.data.length;
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    enabled: enabled && !!groupId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...queryOptions,
  });

  const allExpenses = query.data?.pages.flatMap((page) => page.data) || [];
  const lastPage = query.data?.pages[query.data.pages.length - 1];
  const total = lastPage?.total || 0;

  return {
    expenses: allExpenses,
    total,
    hasMore: !!query.hasNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
