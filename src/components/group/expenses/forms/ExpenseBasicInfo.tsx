import React from "react";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";

import { CurrencySelector } from "./CurrencySelector";
import { VoiceInputButton } from "../VoiceInputButton";
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
  isLoading = false
}: ExpenseBasicInfoProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

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
        {/* Description */}
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
          {errors.description && (
            <p className="text-sm text-destructive" role="alert">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Amount and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            {errors.amount && (
              <p className="text-sm text-destructive" role="alert">
                {errors.amount.message}
              </p>
            )}
          </div>

          <CurrencySelector
            currencies={groupCurrencies}
            value={form.watch("currency_code") || groupCurrencies[0]?.code || "PLN"}
            onChange={(value) => form.setValue("currency_code", value)}
            error={errors.currency_code?.message}
            hasLowConfidence={hasLowConfidence}
          />
        </div>

        {/* Date and Payer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            {errors.expense_date && (
              <p className="text-sm text-destructive" role="alert">
                {errors.expense_date.message}
              </p>
            )}
          </div>

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
                  <SelectTrigger className={`${errors.payer_id ? "border-destructive focus:ring-destructive" : ""} ${hasLowConfidence ? "ring-2 ring-amber-200 border-amber-300" : ""}`}>
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
            {errors.payer_id && (
              <p className="text-sm text-destructive" role="alert">
                {errors.payer_id.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
