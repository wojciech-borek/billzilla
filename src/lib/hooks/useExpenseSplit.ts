import { useState, useCallback, useEffect } from "react";
import type { GroupMemberSummaryDTO, ExpenseSplitCommand } from "@/types";

export function useExpenseSplit(
  members: GroupMemberSummaryDTO[],
  totalAmount: number,
  initialSplits: ExpenseSplitCommand[]
) {
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>(() => {
    // Initialize with current splits or empty
    const amounts: Record<string, string> = {};
    members.forEach((member) => {
      const existingSplit = initialSplits.find((split) => split.profile_id === member.profile_id);
      amounts[member.profile_id] = existingSplit ? existingSplit.amount.toString() : "";
    });
    return amounts;
  });

  // Update local state when splits prop changes (e.g., from voice transcription)
  useEffect(() => {
    const amounts: Record<string, string> = {};
    members.forEach((member) => {
      const existingSplit = initialSplits.find((split) => split.profile_id === member.profile_id);
      amounts[member.profile_id] = existingSplit ? existingSplit.amount.toString() : "";
    });
    setSplitAmounts(amounts);
  }, [initialSplits, members]);

  const updateSplit = useCallback(
    (profileId: string, value: string) => {
      const newAmounts = { ...splitAmounts, [profileId]: value };
      setSplitAmounts(newAmounts);

      // Convert to ExpenseSplitCommand array (only include non-zero amounts)
      const newSplits: ExpenseSplitCommand[] = Object.entries(newAmounts)
        .filter(([_, amountStr]) => amountStr.trim() !== "" && !isNaN(parseFloat(amountStr)))
        .map(([profileId, amountStr]) => ({
          profile_id: profileId,
          amount: parseFloat(amountStr) || 0,
        }))
        .filter((split) => split.amount > 0);

      return newSplits;
    },
    [splitAmounts]
  );

  const splitEvenly = useCallback(() => {
    if (totalAmount <= 0 || members.length === 0) return [];

    const equalAmount = Math.round((totalAmount / members.length) * 100) / 100;
    const remainder = Math.round((totalAmount - equalAmount * members.length) * 100) / 100;

    const newAmounts: Record<string, string> = {};
    const newSplits: ExpenseSplitCommand[] = [];

    members.forEach((member, index) => {
      const amount = index === 0 ? equalAmount + remainder : equalAmount;
      newAmounts[member.profile_id] = amount.toFixed(2);
      newSplits.push({
        profile_id: member.profile_id,
        amount: amount,
      });
    });

    setSplitAmounts(newAmounts);
    return newSplits;
  }, [totalAmount, members]);

  const currentSum = Object.values(splitAmounts).reduce((sum, amountStr) => {
    const amount = parseFloat(amountStr) || 0;
    return sum + amount;
  }, 0);

  const remaining = Math.round((totalAmount - currentSum) * 100) / 100;

  return {
    splitAmounts,
    updateSplit,
    splitEvenly,
    currentSum,
    remaining,
  };
}
