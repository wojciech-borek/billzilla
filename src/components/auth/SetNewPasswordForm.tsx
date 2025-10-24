import { useCallback, memo, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthForm, useSetNewPassword } from "@/lib/hooks";
import {
  setNewPasswordSchema,
  type SetNewPasswordData,
} from "@/lib/schemas/authSchemas";

interface SetNewPasswordFormProps {
  token?: string;
  tokenHash?: string;
  accessToken?: string;
  refreshToken?: string;
  errorMessage?: string;
  successMessage?: string;
}

export const SetNewPasswordForm = memo(function SetNewPasswordForm({
  token,
  tokenHash,
  accessToken,
  refreshToken,
  errorMessage,
  successMessage,
}: SetNewPasswordFormProps) {
  const { formData, errors, isLoading: formLoading, handleChange, validate } =
    useAuthForm<SetNewPasswordData>(setNewPasswordSchema);

  const { isLoading: setPasswordLoading, error: setPasswordError, setNewPassword } = useSetNewPassword({
    token,
    tokenHash,
    accessToken,
    refreshToken,
  });

  const isLoading = formLoading || setPasswordLoading;

  const handleSetNewPassword = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      const data = formData as SetNewPasswordData;
      await setNewPassword(data.new_password);
    },
    [formData, validate, setNewPassword]
  );

  return (
    <div className="space-y-6">
      {/* Komunikat sukcesu z URL */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription className="text-sm">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Błąd z URL */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Błąd API */}
      {setPasswordError && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{setPasswordError}</AlertDescription>
        </Alert>
      )}

      {/* Instrukcje */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">Wprowadź nowe hasło do swojego konta.</p>
      </div>

      {/* Formularz ustawiania nowego hasła */}
      <form onSubmit={handleSetNewPassword} className="space-y-4">
        <FormField
          id="new_password"
          label="Nowe hasło"
          type="password"
          placeholder="••••••••"
          value={formData.new_password || ""}
          onChange={(value) => handleChange("new_password", value)}
          error={errors.new_password}
          helperText="Minimum 8 znaków, w tym cyfra i litera"
          disabled={isLoading}
          required
        />

        <FormField
          id="confirm_password"
          label="Powtórz nowe hasło"
          type="password"
          placeholder="••••••••"
          value={formData.confirm_password || ""}
          onChange={(value) => handleChange("confirm_password", value)}
          error={errors.confirm_password}
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
