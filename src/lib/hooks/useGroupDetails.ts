import { useQuery } from "@tanstack/react-query";
import type { GroupDetailDTO } from "../../types";
import { createClient } from "../../db/supabase.client";

interface UseGroupDetailsOptions {
  enabled?: boolean;
}

export function useGroupDetails(groupId: string, options: UseGroupDetailsOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["group-details", groupId],
    queryFn: async (): Promise<GroupDetailDTO> => {
      // Pobierz access token z Supabase
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/groups/${groupId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch group details");
      }

      return response.json();
    },
    enabled: enabled && !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
