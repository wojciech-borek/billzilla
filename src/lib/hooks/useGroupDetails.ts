import { useQuery } from "@tanstack/react-query";
import type { GroupDetailDTO } from "../../types";

interface UseGroupDetailsOptions {
  enabled?: boolean;
}

export function useGroupDetails(groupId: string, userId: string, options: UseGroupDetailsOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["group-details", groupId, userId],
    queryFn: async (): Promise<GroupDetailDTO> => {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch group details");
      }

      return response.json();
    },
    enabled: enabled && !!groupId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
