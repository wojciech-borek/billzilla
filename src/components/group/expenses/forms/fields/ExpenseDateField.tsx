import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/error-message";
import { CalendarIcon } from "lucide-react";
import type { FieldProps } from "./types";

/**
 * Date field component for expense form
 */
export function ExpenseDateField({ form, hasLowConfidence }: FieldProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-2">
      <Label htmlFor="expense_date" className="text-sm font-medium">
        Data wydatku <span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <Input
          id="expense_date"
          type="datetime-local"
          className={`${errors.expense_date ? "border-destructive focus:ring-destructive" : ""} ${hasLowConfidence ? "ring-2 ring-amber-200 border-amber-300" : ""}`}
          {...register("expense_date")}
        />
        <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      <ErrorMessage message={errors.expense_date?.message} />
    </div>
  );
}
