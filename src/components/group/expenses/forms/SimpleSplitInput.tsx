import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users } from "lucide-react";
import { useExpenseSplit } from "@/lib/hooks/useExpenseSplit";
import { SplitMemberRow } from "./SplitMemberRow";
import { SplitSummary } from "./SplitSummary";
import { SplitActions } from "./SplitActions";
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
  const { splitAmounts, updateSplit, splitEvenly, currentSum, remaining } = useExpenseSplit(
    members,
    totalAmount,
    splits
  );

  const handleAmountChange = (profileId: string, value: string) => {
    const newSplits = updateSplit(profileId, value);
    onSplitsChange(newSplits);
  };

  const handleSplitEvenly = () => {
    const newSplits = splitEvenly();
    onSplitsChange(newSplits);
  };

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
        <SplitActions
          totalAmount={totalAmount}
          currentSum={currentSum}
          remaining={remaining}
          currencyCode={currencyCode}
          onSplitEvenly={handleSplitEvenly}
        />

        <Separator />

        {/* Members list */}
        <div className="space-y-3">
          {members.map((member) => (
            <SplitMemberRow
              key={member.profile_id}
              member={member}
              currentAmount={splitAmounts[member.profile_id] || ""}
              currencyCode={currencyCode}
              hasLowConfidence={hasLowConfidence}
              onAmountChange={handleAmountChange}
            />
          ))}
        </div>

        <SplitSummary
          hasParticipants={hasParticipants}
          participantCount={splits.length}
          remaining={remaining}
          currencyCode={currencyCode}
        />
      </CardContent>
    </Card>
  );
}
