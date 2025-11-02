import React from "react";
import type { GroupsQueryState } from "./types";
import { useGroupsSectionState } from "../../lib/hooks";
import { GroupsSectionLoading } from "./GroupsSectionLoading";
import { GroupsSectionError } from "./GroupsSectionError";
import { GroupsSectionEmpty } from "./GroupsSectionEmpty";
import { GroupsSectionContent } from "./GroupsSectionContent";

interface GroupsSectionProps {
  query: GroupsQueryState & {
    refetch: () => Promise<void>;
    loadMore: () => Promise<void>;
    hasMore: boolean;
  };
  onAddExpense?: (groupId: string) => void;
}

/**
 * Compound component for GroupsSection with multiple render states
 * Uses render props pattern to allow flexible state rendering
 */
const GroupsSection = React.memo(({ query, onAddExpense }: GroupsSectionProps) => {
  const { state } = useGroupsSectionState(query);

  const handleOpenGroup = (id: string) => {
    window.location.assign(`/groups/${id}`);
  };

  const handleRetry = () => {
    query.refetch();
  };

  // Render appropriate state component based on current state
  switch (state) {
    case "loading":
      return <GroupsSectionLoading />;
    case "error":
      return <GroupsSectionError error={query.error || "Unknown error"} onRetry={handleRetry} />;
    case "empty":
      return <GroupsSectionEmpty />;
    case "content":
      return (
        <GroupsSectionContent
          groups={query.data}
          hasMore={query.hasMore}
          loading={query.loading}
          onLoadMore={query.loadMore}
          onOpenGroup={handleOpenGroup}
          onAddExpense={onAddExpense}
        />
      );
    default:
      return <GroupsSectionLoading />;
  }
});

GroupsSection.displayName = "GroupsSection";

/**
 * Compound components for custom rendering (Render Props pattern)
 * Allows parent components to customize individual state renderings
 */
GroupsSection.Loading = GroupsSectionLoading;
GroupsSection.Error = GroupsSectionError;
GroupsSection.Empty = GroupsSectionEmpty;
GroupsSection.Content = GroupsSectionContent;

export default GroupsSection;
