import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "../../db/supabase.client";
import type { ArchiveGroupResponseDTO } from "../../types";

export function useArchiveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string): Promise<ArchiveGroupResponseDTO> => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/groups/${groupId}/archive`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Grupa została zarchiwizowana");
    },
    onError: (error) => {
      console.error("Failed to archive group:", error);
      toast.error("Nie udało się zarchiwizować grupy. Spróbuj ponownie.");
    },
  });
}
