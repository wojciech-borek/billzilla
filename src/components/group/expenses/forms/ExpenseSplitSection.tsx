import React from "react";
import { SimpleSplitInput } from "./SimpleSplitInput";
import type { GroupMemberSummaryDTO } from "@/types";
import type { CreateExpenseFormValues } from "@/lib/schemas/expenseSchemas";
import type { UseFormReturn } from "react-hook-form";

interface ExpenseSplitSectionProps {
  form: UseFormReturn<CreateExpenseFormValues>;
  groupMembers: GroupMemberSummaryDTO[];
  hasLowConfidence?: boolean;
}

/**
 * Expense split section component
 * Handles participant selection and split amount management
 */
export function ExpenseSplitSection({ form, groupMembers, hasLowConfidence = false }: ExpenseSplitSectionProps) {
  return (
    <SimpleSplitInput
      members={groupMembers.filter((m) => m.status === "active")}
      totalAmount={form.watch("amount") || 0}
      currencyCode={form.watch("currency_code") || "PLN"}
      splits={form.watch("splits") || []}
      onSplitsChange={(splits) => {
        form.setValue("splits", splits, { shouldValidate: false });
      }}
      hasLowConfidence={hasLowConfidence}
    />
  );
}
