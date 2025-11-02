import { useState, useEffect, useMemo } from "react";
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

  // Load group data when modal opens
  useEffect(() => {
    if (!isOpen || !groupId) {
      return;
    }

    const loadGroupData = async () => {
      // If we already have data from props, use it
      if (initialMembers.length > 0 && initialCurrencies.length > 0) {
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
          members: (groupDataFromApi.members || []).map(
            (member: {
              profile_id: string;
              full_name: string;
              avatar_url: string | null;
              status: string;
              role: string;
            }) => ({
              profile_id: member.profile_id,
              full_name: member.full_name,
              avatar_url: member.avatar_url,
              status: member.status,
              role: member.role,
            })
          ),
          currencies: groupDataFromApi.group_currencies || [],
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Nie udało się załadować danych grupy";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroupData();
  }, [isOpen, groupId, initialMembers, initialCurrencies]);

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
