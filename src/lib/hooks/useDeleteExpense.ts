import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook for deleting an expense
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expenseId, groupId: _groupId }: { expenseId: string; groupId: string }) => {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch expenses and balances
      queryClient.invalidateQueries({ queryKey: ["group", variables.groupId, "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["group", variables.groupId, "balances"] });

      toast.success("Wydatek został usunięty");
    },
    onError: (error) => {
      console.error("Failed to delete expense:", error);
      toast.error("Nie udało się usunąć wydatku. Spróbuj ponownie.");
    },
  });
}
