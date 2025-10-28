import React from "react";
import { ExpenseDateField } from "../fields/ExpenseDateField";
import { ExpensePayerField } from "../fields/ExpensePayerField";
import type { GroupMemberSummaryDTO } from "@/types";
import type { FieldProps } from "../fields/types";

interface ExpenseMetadataFieldsProps extends FieldProps {
  groupMembers: GroupMemberSummaryDTO[];
  currentUserId: string;
}

/**
 * Expense metadata fields section - date and payer selection
 */
export function ExpenseMetadataFields({ form, hasLowConfidence, groupMembers, currentUserId }: ExpenseMetadataFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ExpenseDateField form={form} hasLowConfidence={hasLowConfidence} />
      <ExpensePayerField
        form={form}
        hasLowConfidence={hasLowConfidence}
        groupMembers={groupMembers}
        currentUserId={currentUserId}
      />
    </div>
  );
}
