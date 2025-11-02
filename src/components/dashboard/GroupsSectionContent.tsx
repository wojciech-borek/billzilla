import React from "react";
import GroupCard from "./GroupCard";
import { GroupsSectionHeader } from "./GroupsSectionHeader";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import type { Group } from "./types";

interface GroupsSectionContentProps {
  groups: Group[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => Promise<void>;
  onOpenGroup: (groupId: string) => void;
  onAddExpense?: (groupId: string) => void;
}

/**
 * Content state component for GroupsSection
 * Displays groups grid with infinite scroll functionality
 */
export const GroupsSectionContent = React.memo(
  ({ groups, hasMore, loading, onLoadMore, onOpenGroup, onAddExpense }: GroupsSectionContentProps) => {
    const { observerTarget } = useInfiniteScroll({
      onLoadMore,
      hasMore,
      isLoading: loading,
      enabled: true,
    });

    return (
      <section aria-labelledby="groups-heading">
        <GroupsSectionHeader />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} onOpen={onOpenGroup} onAddExpense={onAddExpense} />
          ))}
        </div>

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div ref={observerTarget} className="mt-6 flex justify-center py-4">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Ładowanie więcej grup...</span>
              </div>
            )}
          </div>
        )}
      </section>
    );
  }
);

GroupsSectionContent.displayName = "GroupsSectionContent";
