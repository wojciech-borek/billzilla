interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
}

/**
 * Visual indicator for pull-to-refresh gesture
 * Shows spinner when pulling or refreshing
 */
export default function PullToRefreshIndicator({ pullDistance, isRefreshing }: PullToRefreshIndicatorProps) {
  const isVisible = pullDistance > 0 || isRefreshing;
  const opacity = Math.min(pullDistance / 80, 1);
  const rotation = (pullDistance / 80) * 360;

  if (!isVisible) return null;

  return (
    <div
      className="fixed left-1/2 top-0 z-50 -translate-x-1/2 transition-transform"
      style={{
        transform: `translateX(-50%) translateY(${Math.min(pullDistance, 80)}px)`,
        opacity: isRefreshing ? 1 : opacity,
      }}
    >
      <div className="rounded-full bg-card p-3 shadow-lg shadow-green-200 border border-gray-100">
        <svg
          className={`h-6 w-6 text-primary ${isRefreshing ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{
            transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
          }}
          aria-hidden="true"
        >
          {isRefreshing ? (
            <>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </>
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
