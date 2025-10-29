import { useRef } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { X } from "lucide-react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { CreateGroupFormValues } from "../../lib/schemas/groupSchemas";
import { useEmailChips } from "../../lib/hooks/useEmailChips";

interface InviteEmailsInputProps {
  control: Control<CreateGroupFormValues>;
  errors: FieldErrors<CreateGroupFormValues>;
}

/**
 * Email chips input component for inviting members
 * Supports: Enter/comma/semicolon to add, click X to remove, max 20 emails
 */
export default function InviteEmailsInput({ control, errors }: InviteEmailsInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { inputValue, inputError, removeEmail, handleKeyDown, handleBlur, setInputValue, setInputError } =
    useEmailChips();

  return (
    <div className="space-y-2">
      <Label htmlFor="invite_emails" className="text-foreground font-medium">
        Zaproś znajomych (opcjonalnie)
      </Label>

      <Controller
        name="invite_emails"
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            {/* Email chips display */}
            {field.value && field.value.length > 0 && (
              <div
                className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border border-border"
                data-testid="invite-email-chips"
              >
                {field.value.map((email) => (
                  <div
                    key={email}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium transition-colors hover:bg-primary/20"
                    data-testid="invite-email-chip"
                  >
                    <span data-testid="invite-email-chip-text">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(email, field.value || [], field.onChange)}
                      className="ml-1 hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
                      aria-label={`Usuń ${email}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input field */}
            <Input
              ref={inputRef}
              id="invite_emails"
              type="email"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError(null);
              }}
              onKeyDown={(e) => handleKeyDown(e, field.value || [], field.onChange)}
              onBlur={() => handleBlur(field.value || [], field.onChange)}
              placeholder="Wpisz adres e-mail i naciśnij Enter"
              className={inputError || errors.invite_emails ? "border-destructive focus-visible:ring-destructive" : ""}
              aria-invalid={inputError || errors.invite_emails ? "true" : "false"}
              aria-describedby="invite-emails-help invite-emails-error"
              data-testid="invite-emails-input"
            />
          </div>
        )}
      />

      {/* Error messages */}
      {inputError && (
        <p className="text-sm text-destructive" role="alert">
          {inputError}
        </p>
      )}
      {errors.invite_emails && (
        <p id="invite-emails-error" className="text-sm text-destructive" role="alert">
          {errors.invite_emails.message}
        </p>
      )}

      {/* Help text */}
      <p id="invite-emails-help" className="text-sm text-muted-foreground">
        Dodaj adresy e-mail osób, które chcesz zaprosić do grupy. Możesz dodać maksymalnie 20 osób. Naciśnij Enter,
        przecinek lub średnik, aby dodać adres.
      </p>
    </div>
  );
}
