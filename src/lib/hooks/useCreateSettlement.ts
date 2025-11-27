import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateSettlementCommand, SettlementDTO } from "../../types";
import { createClient } from "../../db/supabase.client";

interface UseCreateSettlementOptions {
  onSuccess?: (data: SettlementDTO) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for creating a new settlement
 */
export function useCreateSettlement(groupId: string, options: UseCreateSettlementOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: CreateSettlementCommand): Promise<SettlementDTO> => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["group", groupId, "settlements"] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId, "balances"] });
      
      options.onSuccess?.(data);
    },
    onError: (error) => {
      options.onError?.(error);
    },
  });
}
