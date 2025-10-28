import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ExpenseFormFooterProps {
  submitError?: string | null;
  splitValidationError?: string;
  isSubmitting?: boolean;
  isValid?: boolean;
  splitValidationValid?: boolean;
}

/**
 * Footer component for expense form containing error messages and submit button
 */
export function ExpenseFormFooter({
  submitError,
  splitValidationError,
  isSubmitting = false,
  isValid = false,
  splitValidationValid = false,
}: ExpenseFormFooterProps) {
  return (
    <div className="space-y-4">
      {/* Error Messages */}
      {submitError && (
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
          <p className="text-sm text-destructive font-medium">Błąd podczas tworzenia wydatku</p>
          <p className="text-sm text-destructive mt-1">{submitError}</p>
        </div>
      )}

      {/* Split validation error */}
      {splitValidationError && (
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
          <p className="text-sm text-destructive font-medium">Błąd podziału</p>
          <p className="text-sm text-destructive mt-1">{splitValidationError}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={!isValid || isSubmitting || !splitValidationValid} className="min-w-[120px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Tworzenie...
            </>
          ) : (
            "Utwórz wydatek"
          )}
        </Button>
      </div>
    </div>
  );
}
