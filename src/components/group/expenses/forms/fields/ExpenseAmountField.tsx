import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/error-message";
import type { FieldProps } from "./types";

/**
 * Amount field component for expense form
 */
export function ExpenseAmountField({ form, hasLowConfidence }: FieldProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-2">
      <Label htmlFor="amount" className="text-sm font-medium">
        Kwota <span className="text-destructive">*</span>
      </Label>
      <Input
        id="amount"
        type="number"
        step="0.01"
        min="0"
        placeholder="0,00"
        className={`${errors.amount ? "border-destructive focus:ring-destructive" : ""} ${hasLowConfidence ? "ring-2 ring-amber-200 border-amber-300" : ""}`}
        {...register("amount", { valueAsNumber: true })}
        defaultValue=""
      />
      <ErrorMessage message={errors.amount?.message} />
    </div>
  );
}
