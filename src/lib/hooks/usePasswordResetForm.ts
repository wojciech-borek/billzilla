import { useState, useCallback, type FormEvent } from "react";
import { useAuthForm, usePasswordReset } from "@/lib/hooks";
import { requestPasswordResetSchema, type RequestPasswordResetData } from "@/lib/schemas/authSchemas";

export function usePasswordResetForm() {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const {
    formData,
    errors,
    isLoading: formLoading,
    handleChange,
    validate,
    reset: resetForm,
  } = useAuthForm<RequestPasswordResetData>(requestPasswordResetSchema);

  const { isLoading: resetLoading, error: resetError, requestReset } = usePasswordReset();

  const isLoading = formLoading || resetLoading;

  const handleSubmit = useCallback(
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

  return {
    formData,
    errors,
    isLoading,
    handleSubmit,
    handleChange,
    showSuccessMessage,
    resetError,
  };
}
