import { useCallback, type FormEvent } from "react";
import { useAuthForm, useSupabaseAuth } from "@/lib/hooks";
import { loginSchema, type LoginFormData } from "@/lib/schemas/authSchemas";
import { getAuthErrorMessage } from "@/lib/utils/authErrors";

export function useLoginForm(redirectTo: string) {
  const { formData, errors, isLoading, apiError, setIsLoading, setApiError, handleChange, validate } =
    useAuthForm<LoginFormData>(loginSchema);
  const { signIn } = useSupabaseAuth();

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!validate()) return;

      setIsLoading(true);
      setApiError(null);

      try {
        // After validation, formData is guaranteed to match LoginFormData type
        const validatedData = formData as LoginFormData;
        const { error } = await signIn({ email: validatedData.email, password: validatedData.password });
        if (error) {
          setApiError(getAuthErrorMessage(error));
          setIsLoading(false);
          return;
        }
        // Navigate after successful login
        // eslint-disable-next-line react-compiler/react-compiler
        window.location.href = redirectTo;
      } catch (err) {
        setApiError(getAuthErrorMessage(err));
        setIsLoading(false);
      }
    },
    [formData, redirectTo, setApiError, setIsLoading, signIn, validate]
  );

  return { formData, errors, isLoading, apiError, handleChange, handleSubmit };
}
