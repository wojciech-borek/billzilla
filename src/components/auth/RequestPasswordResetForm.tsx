import { memo } from "react";
import { usePasswordResetForm } from "@/lib/hooks";
import { PasswordResetMessages } from "./PasswordResetMessages";
import { PasswordResetFormFields } from "./PasswordResetFormFields";
import { PasswordResetActions } from "./PasswordResetActions";

interface RequestPasswordResetFormProps {
  errorMessage?: string;
}

export const RequestPasswordResetForm = memo(function RequestPasswordResetForm({
  errorMessage,
}: RequestPasswordResetFormProps) {
  const { formData, errors, isLoading, handleSubmit, handleChange, showSuccessMessage, resetError } =
    usePasswordResetForm();

  return (
    <div className="space-y-6">
      <PasswordResetMessages
        showSuccessMessage={showSuccessMessage}
        errorMessage={errorMessage}
        resetError={resetError}
      />

      {/* Instructions */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Podaj adres e-mail powiązany z Twoim kontem. Wyślemy Ci link do resetowania hasła.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordResetFormFields formData={formData} errors={errors} isLoading={isLoading} onChange={handleChange} />

        <PasswordResetActions isLoading={isLoading} />
      </form>
    </div>
  );
});
