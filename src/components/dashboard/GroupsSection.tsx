import type { GroupsQueryState } from "./types";
import GroupCard from "./GroupCard";
import SectionEmptyState from "./SectionEmptyState";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";

interface GroupsSectionProps {
  query: GroupsQueryState & {
    refetch: () => Promise<void>;
    loadMore: () => Promise<void>;
    hasMore: boolean;
  };
  onAddExpense?: (groupId: string) => void;
}

/**
 * Groups section component
 * Displays user's groups in a grid with loading, error states and infinite scroll
 */
export default function GroupsSection({ query, onAddExpense }: GroupsSectionProps) {
  const { observerTarget } = useInfiniteScroll({
    onLoadMore: query.loadMore,
    hasMore: query.hasMore,
    isLoading: query.loading,
    enabled: true,
  });
  const handleOpenGroup = (id: string) => {
    window.location.href = `/groups/${id}`;
  };

  const handleRetry = () => {
    query.refetch();
  };

  // Loading state
  if (query.loading && query.data.length === 0) {
    return (
      <section aria-labelledby="groups-heading">
        <h2 id="groups-heading" className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          Twoje grupy
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted/50" aria-hidden="true" />
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (query.error) {
    return (
      <section aria-labelledby="groups-heading">
        <h2 id="groups-heading" className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          Twoje grupy
        </h2>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 text-destructive shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-base font-bold text-destructive">Błąd podczas ładowania grup</h3>
              <p className="mt-2 text-sm text-destructive/80">{query.error}</p>
              <button
                onClick={handleRetry}
                className="mt-4 text-sm font-medium text-destructive underline hover:text-destructive/80 transition-colors"
              >
                Spróbuj ponownie
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (query.data.length === 0) {
    return (
      <section aria-labelledby="groups-heading">
        <h2 id="groups-heading" className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          Twoje grupy
        </h2>
        <SectionEmptyState
          title="Brak grup"
          description="Nie należysz jeszcze do żadnej grupy. Utwórz nową grupę lub poczekaj na zaproszenie."
        />
      </section>
    );
  }

  // Success state with data
  return (
    <section aria-labelledby="groups-heading">
      <h2 id="groups-heading" className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Twoje grupy
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {query.data.map((group) => (
          <GroupCard key={group.id} group={group} onOpen={handleOpenGroup} onAddExpense={onAddExpense} />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {query.hasMore && (
        <div ref={observerTarget} className="mt-6 flex justify-center py-4">
          {query.loading && (
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
