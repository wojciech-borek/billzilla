import { useEffect, useRef, useCallback } from 'react';

type UseInfiniteScrollOptions = {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
  enabled?: boolean;
};

/**
 * Hook for infinite scroll functionality
 * Triggers load more when user scrolls near bottom
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 300,
  enabled = true,
}: UseInfiniteScrollOptions) {
  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(isLoading);

  // Keep ref in sync
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (
        entry.isIntersecting &&
        hasMore &&
        !isLoadingRef.current &&
        enabled
      ) {
        onLoadMore();
      }
    },
    [hasMore, onLoadMore, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0,
    });

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [handleIntersection, threshold, enabled]);

  return { observerTarget };
}

