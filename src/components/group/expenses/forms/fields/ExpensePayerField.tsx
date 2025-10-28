import React from "react";
import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorMessage } from "@/components/ui/error-message";
import type { GroupMemberSummaryDTO } from "@/types";
import type { FieldProps } from "./types";

interface ExpensePayerFieldProps extends FieldProps {
  groupMembers: GroupMemberSummaryDTO[];
  currentUserId: string;
}

/**
 * Payer field component for expense form
 */
export function ExpensePayerField({ form, hasLowConfidence, groupMembers, currentUserId }: ExpensePayerFieldProps) {
  const {
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-2">
      <Label htmlFor="payer_id" className="text-sm font-medium">
        Płatnik <span className="text-destructive">*</span>
      </Label>
      <Controller
        name="payer_id"
        control={control}
        defaultValue={currentUserId}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger
              className={`${errors.payer_id ? "border-destructive focus:ring-destructive" : ""} ${hasLowConfidence ? "ring-2 ring-amber-200 border-amber-300" : ""}`}
            >
              <SelectValue placeholder="Wybierz płatnika" />
            </SelectTrigger>
            <SelectContent>
              {groupMembers
                .filter((member) => member.status === "active")
                .map((member) => (
                  <SelectItem key={member.profile_id} value={member.profile_id}>
                    {member.full_name || "Nieznany użytkownik"}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
      />
      <ErrorMessage message={errors.payer_id?.message} />
    </div>
  );
}
