/**
 * React Query hooks for currency management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GroupCurrenciesDTO, AddCurrencyCommand, UpdateCurrencyCommand } from "@/types";
import { toast } from "sonner";

/**
 * Hook to manage group currencies with React Query
 */
export const useGroupCurrencies = (groupId: string) => {
  const queryClient = useQueryClient();

  // Fetch group currencies
  const { data, isLoading, error } = useQuery({
    queryKey: ["group-currencies", groupId],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupId}/currencies`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch currencies");
      }
      return response.json() as Promise<GroupCurrenciesDTO>;
    },
    enabled: !!groupId,
  });

  // Add currency mutation
  const addCurrency = useMutation({
    mutationFn: async (command: AddCurrencyCommand) => {
      const response = await fetch(`/api/groups/${groupId}/currencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to add currency");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-currencies", groupId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update exchange rate mutation
  const updateRate = useMutation({
    mutationFn: async ({ code, exchange_rate }: { code: string; exchange_rate: number }) => {
      const response = await fetch(`/api/groups/${groupId}/currencies/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchange_rate } as UpdateCurrencyCommand),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to update rate");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-currencies", groupId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove currency mutation
  const removeCurrency = useMutation({
    mutationFn: async (currencyCode: string) => {
      const response = await fetch(`/api/groups/${groupId}/currencies/${currencyCode}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to remove currency");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-currencies", groupId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    currencies: data,
    isLoading,
    error,
    addCurrency,
    updateRate,
    removeCurrency,
  };
};
