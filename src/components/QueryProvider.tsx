import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface QueryProviderProps {
  children: React.ReactNode;
}

// Create a client function for SSR compatibility
const makeQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds (reduced for balances)
        gcTime: 5 * 60 * 1000, // 5 minutes (reduced)
        retry: (failureCount, error: unknown) => {
          // Don't retry on 4xx errors except 408 (timeout) and 429 (rate limit)
          if (error?.status >= 400 && error?.status < 500 && error?.status !== 408 && error?.status !== 429) {
            return false;
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: true, // Enable refetch on window focus
        refetchOnReconnect: "always",
      },
      mutations: {
        retry: false,
      },
    },
  });
};

let browserQueryClient: QueryClient | undefined = undefined;

const getQueryClient = () => {
  // Server: always make a new query client
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  // Browser: make a new query client if we don't already have one
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
};

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
