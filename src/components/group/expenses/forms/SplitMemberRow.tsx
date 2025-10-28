import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInitials } from "@/lib/utils";
import type { GroupMemberSummaryDTO } from "@/types";

interface SplitMemberRowProps {
  member: GroupMemberSummaryDTO;
  currentAmount: string;
  currencyCode: string;
  hasLowConfidence?: boolean;
  onAmountChange: (profileId: string, value: string) => void;
}

export function SplitMemberRow({
  member,
  currentAmount,
  currencyCode,
  hasLowConfidence = false,
  onAmountChange,
}: SplitMemberRowProps) {
  const amount = parseFloat(currentAmount) || 0;
  const isParticipant = amount > 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
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
          onChange={(e) => onAmountChange(member.profile_id, e.target.value)}
          className={`text-right ${hasLowConfidence ? "ring-2 ring-amber-200 border-amber-300" : ""}`}
        />
      </div>

      <span className="text-sm text-muted-foreground w-6">{currencyCode}</span>
    </div>
  );
}
