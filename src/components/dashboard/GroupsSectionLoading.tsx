import React from "react";
import { GroupsSectionHeader } from "./GroupsSectionHeader";

/**
 * Loading state component for GroupsSection
 * Shows skeleton placeholders while loading groups
 */
export const GroupsSectionLoading = React.memo(() => {
  return (
    <section aria-labelledby="groups-heading">
      <GroupsSectionHeader />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted/50" aria-hidden="true" />
        ))}
      </div>
    </section>
  );
});

GroupsSectionLoading.displayName = "GroupsSectionLoading";
