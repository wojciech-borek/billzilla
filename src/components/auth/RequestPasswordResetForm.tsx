import { useState, useCallback, memo, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusMessage } from "@/components/ui/status-message";
import { useAuthForm, usePasswordReset } from "@/lib/hooks";
import { requestPasswordResetSchema, type RequestPasswordResetData } from "@/lib/schemas/authSchemas";
import { AUTH_SUCCESS_MESSAGES } from "@/lib/utils/authErrors";

interface RequestPasswordResetFormProps {
  errorMessage?: string;
}

export const RequestPasswordResetForm = memo(function RequestPasswordResetForm({
  errorMessage,
}: RequestPasswordResetFormProps) {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const {
    formData,
    errors,
    isLoading: formLoading,
    handleChange,
    validate,
    reset: resetForm,
  } = useAuthForm<RequestPasswordResetData>(requestPasswordResetSchema);

  const { isLoading: resetLoading, error: resetError, requestReset, reset: resetReset } = usePasswordReset();

  const isLoading = formLoading || resetLoading;

  const handleRequestReset = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      const data = formData as RequestPasswordResetData;
      const resetSuccess = await requestReset(data.email);

      if (resetSuccess) {
        setShowSuccessMessage(true);
        resetForm();
      }
    },
    [formData, validate, requestReset, resetForm]
  );


  return (
    <div className="space-y-6">
      {/* Komunikat sukcesu */}
      {showSuccessMessage && (
        <StatusMessage
          type="success"
          title={AUTH_SUCCESS_MESSAGES.passwordResetRequested}
          message="Sprawdź swoją skrzynkę e-mail i kliknij w link, aby zresetować hasło."
        />
      )}

      {/* Błąd z URL */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Błąd API */}
      {resetError && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{resetError}</AlertDescription>
        </Alert>
      )}

      {/* Instrukcje */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Podaj adres e-mail powiązany z Twoim kontem. Wyślemy Ci link do resetowania hasła.
        </p>
      </div>

      {/* Formularz żądania resetu */}
      <form onSubmit={handleRequestReset} className="space-y-4">
        <FormField
          id="email"
          label="Adres e-mail"
          type="email"
          placeholder="twoj@email.com"
          value={formData.email || ""}
          onChange={(value) => handleChange("email", value)}
          error={errors.email}
          disabled={isLoading}
          required
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl transition-all duration-300 ease-out"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Wysyłanie...
            </>
          ) : (
            "Wyślij link resetujący"
          )}
        </Button>
      </form>

      {/* Link powrotu do logowania */}
      <p className="text-center text-sm text-gray-600">
        Pamiętasz hasło?{" "}
        <a href="/login" className="text-primary hover:text-primary-dark font-medium transition-colors duration-300">
          Wróć do logowania
        </a>
      </p>
    </div>
  );
});
