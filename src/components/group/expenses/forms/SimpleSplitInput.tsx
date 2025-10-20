import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users, Divide } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { GroupMemberSummaryDTO, ExpenseSplitCommand } from "@/types";

interface SimpleSplitInputProps {
  members: GroupMemberSummaryDTO[];
  totalAmount: number;
  currencyCode: string;
  splits: ExpenseSplitCommand[];
  onSplitsChange: (splits: ExpenseSplitCommand[]) => void;
  hasLowConfidence?: boolean;
}

/**
 * Simplified split input component - shows all group members with amount inputs
 * Participants are anyone who has an amount > 0 assigned
 */
export function SimpleSplitInput({
  members,
  totalAmount,
  currencyCode,
  splits,
  onSplitsChange,
  hasLowConfidence = false,
}: SimpleSplitInputProps) {
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>(() => {
    // Initialize with current splits or empty
    const amounts: Record<string, string> = {};
    members.forEach((member) => {
      const existingSplit = splits.find((split) => split.profile_id === member.profile_id);
      amounts[member.profile_id] = existingSplit ? existingSplit.amount.toString() : "";
    });
    return amounts;
  });

  const handleAmountChange = useCallback(
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

      onSplitsChange(newSplits);
    },
    [splitAmounts, onSplitsChange]
  );

  const handleSplitEvenly = useCallback(() => {
    if (totalAmount <= 0 || members.length === 0) return;

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
    onSplitsChange(newSplits);
  }, [totalAmount, members, onSplitsChange]);

  const currentSum = Object.values(splitAmounts).reduce((sum, amountStr) => {
    const amount = parseFloat(amountStr) || 0;
    return sum + amount;
  }, 0);

  const remaining = Math.round((totalAmount - currentSum) * 100) / 100;
  const hasParticipants = splits.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Uczestnicy wydatku
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Wprowadź kwoty dla uczestników. Uczestnikami są osoby, które mają przypisaną kwotę większą od zera.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Split evenly button */}
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSplitEvenly}
            disabled={totalAmount <= 0}
            className="flex items-center gap-2"
          >
            <Divide className="h-4 w-4" />
            Podziel po równo
          </Button>

          {totalAmount > 0 && (
            <div className="text-sm text-muted-foreground">
              Razem: {currentSum.toFixed(2)} {currencyCode}
              {remaining !== 0 && (
                <span className={remaining > 0 ? "text-orange-600" : "text-red-600"}>
                  {" "}
                  ({remaining > 0 ? "+" : ""}
                  {remaining.toFixed(2)})
                </span>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Members list */}
        <div className="space-y-3">
          {members.map((member) => {
            const currentAmount = splitAmounts[member.profile_id] || "";
            const amount = parseFloat(currentAmount) || 0;
            const isParticipant = amount > 0;

            return (
              <div key={member.profile_id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                {/* Avatar */}
                <div className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary/30 text-xs font-semibold text-primary shadow-sm">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name || "User avatar"}
                      className="h-full w-full rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span aria-label={member.full_name || "Unknown user"}>{getInitials(member.full_name)}</span>
                  )}
                </div>

                {/* Member info */}
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-medium">{member.full_name || "Nieznany użytkownik"}</Label>
                  {isParticipant && <p className="text-xs text-muted-foreground">Uczestnik</p>}
                </div>

                {/* Amount input */}
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={currentAmount}
                    onChange={(e) => handleAmountChange(member.profile_id, e.target.value)}
                    className={`text-right ${hasLowConfidence ? "ring-2 ring-amber-200 border-amber-300" : ""}`}
                  />
                </div>

                <span className="text-sm text-muted-foreground w-6">{currencyCode}</span>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {hasParticipants && (
          <>
            <Separator />
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Uczestników: {splits.length}</span>
              <span
                className={`font-medium ${remaining === 0 ? "text-green-600" : remaining > 0 ? "text-orange-600" : "text-red-600"}`}
              >
                {remaining === 0
                  ? "Kwoty się zgadzają"
                  : remaining > 0
                    ? `Do podziału: ${remaining.toFixed(2)} ${currencyCode}`
                    : `Nadwyżka: ${Math.abs(remaining).toFixed(2)} ${currencyCode}`}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
