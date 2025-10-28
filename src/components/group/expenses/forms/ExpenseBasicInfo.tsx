import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { VoiceInputButton } from "../VoiceInputButton";
import { BasicInfoFields } from "./sections/BasicInfoFields";
import { ExpenseMetadataFields } from "./sections/ExpenseMetadataFields";
import type { GroupMemberSummaryDTO, GroupCurrencyDTO, TranscriptionResultDTO, TranscriptionErrorDTO } from "@/types";
import type { CreateExpenseFormValues } from "@/lib/schemas/expenseSchemas";
import type { UseFormReturn } from "react-hook-form";

interface ExpenseBasicInfoProps {
  form: UseFormReturn<CreateExpenseFormValues>;
  groupMembers: GroupMemberSummaryDTO[];
  groupCurrencies: GroupCurrencyDTO[];
  currentUserId: string;
  hasLowConfidence?: boolean;
  groupId: string;
  onTranscriptionComplete?: (result: TranscriptionResultDTO) => void;
  onTranscriptionError?: (error: TranscriptionErrorDTO) => void;
  isLoading?: boolean;
}

/**
 * Basic information section of expense form
 * Handles description, amount, currency, date, and payer selection
 */
export function ExpenseBasicInfo({
  form,
  groupMembers,
  groupCurrencies,
  currentUserId,
  hasLowConfidence = false,
  groupId,
  onTranscriptionComplete,
  onTranscriptionError,
  isLoading = false,
}: ExpenseBasicInfoProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Informacje podstawowe</CardTitle>
          <VoiceInputButton
            groupId={groupId}
            onTranscriptionComplete={onTranscriptionComplete || (() => {})}
            onTranscriptionError={onTranscriptionError || (() => {})}
            disabled={isLoading}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <BasicInfoFields
          form={form}
          hasLowConfidence={hasLowConfidence}
          groupCurrencies={groupCurrencies}
        />

        <ExpenseMetadataFields
          form={form}
          hasLowConfidence={hasLowConfidence}
          groupMembers={groupMembers}
          currentUserId={currentUserId}
        />
      </CardContent>
    </Card>
  );
}
