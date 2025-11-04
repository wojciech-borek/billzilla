import React from "react";
import { Controller } from "react-hook-form";
import { ExpenseDescriptionField } from "../fields/ExpenseDescriptionField";
import { ExpenseAmountField } from "../fields/ExpenseAmountField";
import { CurrencySelector } from "../CurrencySelector";
import type { GroupCurrencyDTO } from "@/types";
import type { FieldProps } from "../fields/types";

interface BasicInfoFieldsProps extends FieldProps {
  groupCurrencies: GroupCurrencyDTO[];
}

/**
 * Basic information fields section - description, amount, and currency
 */
export function BasicInfoFields({ form, hasLowConfidence, groupCurrencies }: BasicInfoFieldsProps) {
  return (
    <>
      {/* Description */}
      <ExpenseDescriptionField form={form} hasLowConfidence={hasLowConfidence} />

      {/* Amount and Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExpenseAmountField form={form} hasLowConfidence={hasLowConfidence} />
        <Controller
          name="currency_code"
          control={form.control}
          render={({ field }) => (
            <CurrencySelector
              currencies={groupCurrencies}
              value={field.value}
              onChange={field.onChange}
              error={form.formState.errors.currency_code?.message}
              hasLowConfidence={hasLowConfidence}
            />
          )}
        />
      </div>
    </>
  );
}
