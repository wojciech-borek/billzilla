import React from "react";
import SectionEmptyState from "./SectionEmptyState";
import { GroupsSectionHeader } from "./GroupsSectionHeader";

/**
 * Empty state component for GroupsSection
 * Shows message when user has no groups
 */
export const GroupsSectionEmpty = React.memo(() => {
  return (
    <section aria-labelledby="groups-heading">
      <GroupsSectionHeader />
      <SectionEmptyState
        title="Brak grup"
        description="Nie należysz jeszcze do żadnej grupy. Utwórz nową grupę lub poczekaj na zaproszenie."
      />
    </section>
  );
});

GroupsSectionEmpty.displayName = "GroupsSectionEmpty";
