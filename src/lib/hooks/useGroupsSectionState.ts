import type { GroupsQueryState } from "../types";

export type GroupsSectionState = "loading" | "error" | "empty" | "content";

interface UseGroupsSectionStateReturn {
  state: GroupsSectionState;
  query: GroupsQueryState & {
    refetch: () => Promise<void>;
    loadMore: () => Promise<void>;
    hasMore: boolean;
  };
}

/**
 * Custom hook to manage GroupsSection rendering state
 * Determines which UI state should be displayed based on query state
 */
export function useGroupsSectionState(
  query: GroupsQueryState & {
    refetch: () => Promise<void>;
    loadMore: () => Promise<void>;
    hasMore: boolean;
  }
): UseGroupsSectionStateReturn {
  const getState = (): GroupsSectionState => {
    // Loading state - show loading when loading and no data yet
    if (query.loading && query.data.length === 0) {
      return "loading";
    }

    // Error state - show error when there's an error
    if (query.error) {
      return "error";
    }

    // Empty state - show empty when no data and not loading
    if (query.data.length === 0) {
      return "empty";
    }

    // Content state - show content when there's data
    return "content";
  };

  return {
    state: getState(),
    query,
  };
}
