import { useState, useCallback } from "react";
import type { InvitationsQueryState } from "../types";

interface InvitationActionResult {
  success: boolean;
  error?: string;
}

interface InvitationsQueryWithActions extends InvitationsQueryState {
  refetch: () => Promise<void>;
  accept: (id: string) => Promise<InvitationActionResult>;
  decline: (id: string) => Promise<InvitationActionResult>;
}

interface UseInvitationManagementReturn {
  processingIds: Set<string>;
  errors: Map<string, string>;
  acceptInvitation: (id: string) => Promise<void>;
  declineInvitation: (id: string) => Promise<void>;
}

/**
 * Custom hook for managing invitation processing state and actions
 */
export function useInvitationManagement(
  query: InvitationsQueryWithActions,
  onChanged?: () => void
): UseInvitationManagementReturn {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const acceptInvitation = useCallback(
    async (id: string) => {
      // Lock the card during processing
      setProcessingIds((prev) => new Set(prev).add(id));
      setErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(id);
        return newErrors;
      });

      const result = await query.accept(id);

      if (result.success) {
        // Notify parent to refetch groups
        onChanged?.();
      } else {
        // Show error on the card
        setErrors((prev) => new Map(prev).set(id, result.error || "Nieznany błąd"));
        setProcessingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    },
    [query, onChanged]
  );

  const declineInvitation = useCallback(
    async (id: string) => {
      // Lock the card during processing
      setProcessingIds((prev) => new Set(prev).add(id));
      setErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(id);
        return newErrors;
      });

      const result = await query.decline(id);

      if (result.success) {
        // Success - invitation removed from list by the query hook
      } else {
        // Show error on the card
        setErrors((prev) => new Map(prev).set(id, result.error || "Nieznany błąd"));
        setProcessingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    },
    [query]
  );

  return {
    processingIds,
    errors,
    acceptInvitation,
    declineInvitation,
  };
}
