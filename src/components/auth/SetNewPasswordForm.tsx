import { memo } from "react";
import { useSetNewPasswordForm } from "@/lib/hooks";
import { SetNewPasswordMessages } from "./SetNewPasswordMessages";
import { SetNewPasswordFields } from "./SetNewPasswordFields";
import { SetNewPasswordActions } from "./SetNewPasswordActions";

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
  const { formData, errors, isLoading, setPasswordError, handleChange, handleSubmit } = useSetNewPasswordForm({
    token,
    tokenHash,
    accessToken,
    refreshToken,
  });

  return (
    <div className="space-y-6">
      {/* Komunikaty statusu */}
      <SetNewPasswordMessages
        successMessage={successMessage}
        errorMessage={errorMessage}
        setPasswordError={setPasswordError}
      />

      {/* Instrukcje */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">Wprowadź nowe hasło do swojego konta.</p>
      </div>

      {/* Formularz ustawiania nowego hasła */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <SetNewPasswordFields formData={formData} errors={errors} isLoading={isLoading} onChange={handleChange} />

        <SetNewPasswordActions isLoading={isLoading} />
      </form>
    </div>
  );
});
