import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import type { GroupMemberSummaryDTO, GroupCurrencyDTO } from "@/types";

interface UseExpenseModalDataProps {
  groupId: string;
  isOpen: boolean;
  initialMembers?: GroupMemberSummaryDTO[];
  initialCurrencies?: GroupCurrencyDTO[];
}

interface ExpenseModalData {
  members: GroupMemberSummaryDTO[];
  currencies: GroupCurrencyDTO[];
  isLoading: boolean;
  error: string | null;
}

// Utility function to transform API member data
const transformApiMember = (member: {
  profile_id: string;
  full_name: string;
  avatar_url: string | null;
  status: string;
  role: string;
}): GroupMemberSummaryDTO => ({
  profile_id: member.profile_id,
  full_name: member.full_name,
  avatar_url: member.avatar_url,
  status: member.status,
  role: member.role,
});

// Check if initial data is meaningfully available
const hasInitialData = (initialMembers?: GroupMemberSummaryDTO[], initialCurrencies?: GroupCurrencyDTO[]): boolean => {
  return Boolean(initialMembers && initialMembers.length > 0 && initialCurrencies && initialCurrencies.length > 0);
};

export function useExpenseModalData({
  groupId,
  isOpen,
  initialMembers = [],
  initialCurrencies = [],
}: UseExpenseModalDataProps): ExpenseModalData {
  const [data, setData] = useState<{
    members: GroupMemberSummaryDTO[];
    currencies: GroupCurrencyDTO[];
  }>({
    members: initialMembers,
    currencies: initialCurrencies,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the check for initial data availability
  const hasValidInitialData = useMemo(
    () => hasInitialData(initialMembers, initialCurrencies),
    [initialMembers, initialCurrencies]
  );

  // Load group data when modal opens
  const loadGroupData = useCallback(async () => {
    // Early return if no groupId
    if (!groupId) {
      return;
    }

    // If we already have valid initial data, use it
    if (hasValidInitialData) {
      setData({
        members: initialMembers,
        currencies: initialCurrencies,
      });
      setError(null);
      return;
    }

    // Otherwise load from API
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/groups/${groupId}`);
      if (!response.ok) {
        throw new Error("Nie udało się załadować danych grupy");
      }

      const groupDataFromApi = await response.json();

      setData({
        members: (groupDataFromApi.members || []).map(transformApiMember),
        currencies: groupDataFromApi.group_currencies || [],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się załadować danych grupy";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, hasValidInitialData, initialMembers, initialCurrencies]);

  useEffect(() => {
    if (isOpen) {
      loadGroupData();
    } else {
      // Reset error state when modal closes
      setError(null);
    }
  }, [isOpen, loadGroupData]);

  return useMemo(
    () => ({
      members: data.members,
      currencies: data.currencies,
      isLoading,
      error,
    }),
    [data.members, data.currencies, isLoading, error]
  );
}
