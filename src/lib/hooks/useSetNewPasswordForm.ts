import { useCallback, type FormEvent } from "react";
import { useAuthForm, useSetNewPassword } from "@/lib/hooks";
import { setNewPasswordSchema, type SetNewPasswordData } from "@/lib/schemas/authSchemas";

interface UseSetNewPasswordFormParams {
  token?: string;
  tokenHash?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface UseSetNewPasswordFormReturn {
  formData: SetNewPasswordData;
  errors: Record<string, string>;
  isLoading: boolean;
  setPasswordError: string | null;
  handleChange: (field: keyof SetNewPasswordData, value: unknown) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
}

/**
 * Hook łączący logikę formularza i ustawiania nowego hasła
 * Centralizuje walidację, obsługę błędów i submit
 */
export function useSetNewPasswordForm({
  token,
  tokenHash,
  accessToken,
  refreshToken,
}: UseSetNewPasswordFormParams): UseSetNewPasswordFormReturn {
  const {
    formData,
    errors,
    isLoading: formLoading,
    handleChange,
    validate,
  } = useAuthForm<SetNewPasswordData>(setNewPasswordSchema);

  const {
    isLoading: setPasswordLoading,
    error: setPasswordError,
    setNewPassword,
  } = useSetNewPassword({
    token,
    tokenHash,
    accessToken,
    refreshToken,
  });

  const isLoading = formLoading || setPasswordLoading;

  const handleSubmit = useCallback(
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

  return {
    formData,
    errors,
    isLoading,
    setPasswordError,
    handleChange,
    handleSubmit,
  };
}
