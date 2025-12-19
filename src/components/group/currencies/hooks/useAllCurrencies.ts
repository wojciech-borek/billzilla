/**
 * React Query hook for fetching all available currencies
 */

import { useQuery } from "@tanstack/react-query";
import type { CurrencyDTO } from "../../../../types";

/**
 * Hook to fetch all available currencies from the system
 * Data is cached for 1 hour as currencies rarely change
 */
export const useAllCurrencies = () => {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: async () => {
      const response = await fetch("/api/currencies");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch currencies");
      }
      return response.json() as Promise<CurrencyDTO[]>;
    },
    staleTime: 1000 * 60 * 60, // 1 hour - currencies rarely change
  });
};
