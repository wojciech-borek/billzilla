import { useState, useCallback, useMemo, memo, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { useAuthForm, useSupabaseAuth } from "@/lib/hooks";
import {
  requestPasswordResetSchema,
  setNewPasswordSchema,
  type RequestPasswordResetData,
  type SetNewPasswordData,
} from "@/lib/schemas/authSchemas";
import { getAuthErrorMessage, AUTH_SUCCESS_MESSAGES } from "@/lib/utils/authErrors";

interface ResetPasswordFormProps {
  mode: "request" | "reset";
  errorMessage?: string;
  successMessage?: string;
}

export const ResetPasswordForm = memo(function ResetPasswordForm({
  mode,
  errorMessage,
  successMessage,
}: ResetPasswordFormProps) {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Wybierz schema w zależności od trybu (useMemo aby nie tworzyć ponownie przy każdym renderze)
  const schema = useMemo(() => (mode === "request" ? requestPasswordResetSchema : setNewPasswordSchema), [mode]);

  // Jeden hook dla obu trybów z odpowiednią schema
  type FormData = RequestPasswordResetData | SetNewPasswordData;
  const { formData, errors, isLoading, apiError, setIsLoading, setApiError, handleChange, validate, reset } =
    useAuthForm<FormData>(schema);

  const { resetPassword, updateUser } = useSupabaseAuth();

  const handleRequestReset = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      setIsLoading(true);
      setApiError(null);
      setShowSuccessMessage(false);

      try {
        const data = formData as RequestPasswordResetData;
        const { error } = await resetPassword(data.email);

        if (error) {
          setApiError(getAuthErrorMessage(error));
          return;
        }

        // Sukces - wyświetl komunikat
        if (import.meta.env.DEV) {
          console.log("✅ Link resetujący hasło został wysłany!");
        }
        setShowSuccessMessage(true);
        reset();
      } catch (err) {
        // Log error in development environment
        if (import.meta.env.DEV) {
          console.error("Błąd żądania resetu hasła:", err);
        }
        setApiError(getAuthErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [formData, reset, resetPassword, setApiError, setIsLoading, validate]
  );

  const handleSetNewPassword = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      setIsLoading(true);
      setApiError(null);

      try {
        const data = formData as SetNewPasswordData;
        const { error } = await updateUser({
          password: data.new_password,
        });

        if (error) {
          setApiError(getAuthErrorMessage(error));
          return;
        }

        // Sukces - w prawdziwej implementacji nastąpi przekierowanie na login
        if (import.meta.env.DEV) {
          console.log("✅ Hasło zostało zmienione pomyślnie!");
        }
        // window.location.href = '/login?success=password_changed'
      } catch (err) {
        // Log error in development environment
        if (import.meta.env.DEV) {
          console.error("Błąd zmiany hasła:", err);
        }
        setApiError(getAuthErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [formData, setApiError, setIsLoading, updateUser, validate]
  );

  // Renderowanie trybu żądania resetu
  if (mode === "request") {
    return (
      <div className="space-y-6">
        {/* Komunikat sukcesu */}
        {showSuccessMessage && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <p className="text-sm font-medium mb-2">✉️ {AUTH_SUCCESS_MESSAGES.passwordResetRequested}</p>
            <p className="text-xs text-green-700">
              Sprawdź swoją skrzynkę e-mail i kliknij w link, aby zresetować hasło.
            </p>
          </Alert>
        )}

        {/* Błąd z URL */}
        {errorMessage && (
          <Alert variant="destructive">
            <p className="text-sm">{errorMessage}</p>
          </Alert>
        )}

        {/* Błąd API */}
        {apiError && (
          <Alert variant="destructive">
            <p className="text-sm">{apiError}</p>
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
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Adres e-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              value={(formData as RequestPasswordResetData).email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/40"
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>

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
  }

  // Renderowanie trybu ustawiania nowego hasła
  return (
    <div className="space-y-6">
      {/* Komunikat sukcesu z URL */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <p className="text-sm">{successMessage}</p>
        </Alert>
      )}

      {/* Błąd z URL */}
      {errorMessage && (
        <Alert variant="destructive">
          <p className="text-sm">{errorMessage}</p>
        </Alert>
      )}

      {/* Błąd API */}
      {apiError && (
        <Alert variant="destructive">
          <p className="text-sm">{apiError}</p>
        </Alert>
      )}

      {/* Instrukcje */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">Wprowadź nowe hasło do swojego konta.</p>
      </div>

      {/* Formularz ustawiania nowego hasła */}
      <form onSubmit={handleSetNewPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new_password" className="text-sm font-medium text-foreground">
            Nowe hasło
          </Label>
          <Input
            id="new_password"
            type="password"
            placeholder="••••••••"
            value={(formData as SetNewPasswordData).new_password || ""}
            onChange={(e) => handleChange("new_password", e.target.value)}
            className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/40"
            disabled={isLoading}
            aria-invalid={!!errors.new_password}
            aria-describedby={errors.new_password ? "new_password-error" : undefined}
          />
          {errors.new_password && (
            <p id="new_password-error" className="text-sm text-red-600" role="alert">
              {errors.new_password}
            </p>
          )}
          <p className="text-xs text-gray-500">Minimum 8 znaków, w tym cyfra i litera</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password" className="text-sm font-medium text-foreground">
            Powtórz nowe hasło
          </Label>
          <Input
            id="confirm_password"
            type="password"
            placeholder="••••••••"
            value={(formData as SetNewPasswordData).confirm_password || ""}
            onChange={(e) => handleChange("confirm_password", e.target.value)}
            className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/40"
            disabled={isLoading}
            aria-invalid={!!errors.confirm_password}
            aria-describedby={errors.confirm_password ? "confirm_password-error" : undefined}
          />
          {errors.confirm_password && (
            <p id="confirm_password-error" className="text-sm text-red-600" role="alert">
              {errors.confirm_password}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl transition-all duration-300 ease-out"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Zmiana hasła...
            </>
          ) : (
            "Ustaw nowe hasło"
          )}
        </Button>
      </form>
    </div>
  );
});
