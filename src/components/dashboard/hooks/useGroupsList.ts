import { useState, useEffect, useCallback } from "react";
import type { PaginatedResponse, GroupListItemDTO } from "@/types";
import type { GroupCardVM, GroupsQueryState } from "../types";

interface UseGroupsListParams {
  status?: "active" | "archived";
  limit?: number;
}

/**
 * Hook for fetching and managing groups list with infinite scroll support
 * Maps GroupListItemDTO to GroupCardVM for presentation
 */
export function useGroupsList({ status = "active", limit = 20 }: UseGroupsListParams = {}): GroupsQueryState & {
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
} {
  const [state, setState] = useState<GroupsQueryState>({
    data: [],
    total: 0,
    limit,
    offset: 0,
    loading: true,
    error: null,
  });

  const fetchGroups = useCallback(
    async (resetData = true, currentOffset = 0) => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        ...(resetData ? { data: [], offset: 0 } : {}),
      }));

      try {
        // Validate parameters
        const validLimit = Math.max(1, Math.min(100, limit));
        const validOffset = Math.max(0, currentOffset);

        const params = new URLSearchParams({
          status,
          limit: validLimit.toString(),
          offset: validOffset.toString(),
        });

        const response = await fetch(`/api/groups?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          // Unauthorized - redirect to login
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Failed to fetch groups: ${response.status}`);
        }

        const result: PaginatedResponse<GroupListItemDTO> = await response.json();

        // Map DTOs to ViewModels
        const groupCards: GroupCardVM[] = result.data.map((group) => ({
          id: group.id,
          name: group.name,
          baseCurrencyCode: group.base_currency_code,
          role: group.role,
          memberCount: group.member_count,
          myBalance: group.my_balance,
          avatars: group.members.map((member) => ({
            profileId: member.profile_id,
            fullName: member.full_name,
            avatarUrl: member.avatar_url,
            isCreator: member.role === "creator",
          })),
        }));

        setState((prev) => ({
          data: resetData ? groupCards : [...prev.data, ...groupCards],
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          loading: false,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        }));
      }
    },
    [status, limit]
  );

  const loadMore = useCallback(async () => {
    const nextOffset = state.offset + limit;
    await fetchGroups(false, nextOffset);
  }, [fetchGroups, state.offset, limit]);

  const refetch = useCallback(async () => {
    await fetchGroups(true, 0);
  }, [fetchGroups]);

  useEffect(() => {
    fetchGroups(true, 0);
  }, [status, limit]); // Removed fetchGroups from deps to avoid infinite loop

  const hasMore = state.data.length < state.total;

  return {
    ...state,
    refetch,
    loadMore,
    hasMore,
  };
}
