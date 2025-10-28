import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/ui/error-message";
import type { FieldProps } from "./types";

/**
 * Description field component for expense form
 */
export function ExpenseDescriptionField({ form, hasLowConfidence }: FieldProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-2">
      <Label htmlFor="description" className="text-sm font-medium">
        Opis wydatku <span className="text-destructive">*</span>
      </Label>
      <Textarea
        id="description"
        placeholder="np. Obiad w restauracji, paliwo do samochodu..."
        className={`${errors.description ? "border-destructive focus:ring-destructive" : ""} ${hasLowConfidence ? "ring-2 ring-amber-200 border-amber-300" : ""}`}
        {...register("description")}
        rows={3}
      />
      <ErrorMessage message={errors.description?.message} />
    </div>
  );
}
