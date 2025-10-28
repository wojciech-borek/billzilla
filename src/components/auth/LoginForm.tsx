import { memo } from "react";
import { useLoginForm } from "@/lib/hooks";
import { LoginFormMessages } from "./LoginFormMessages";
import { LoginFormFields } from "./LoginFormFields";
import { LoginFormActions } from "./LoginFormActions";

interface LoginFormProps {
  errorMessage?: string;
  successMessage?: string;
  redirectTo?: string;
}

export const LoginForm = memo(function LoginForm({ errorMessage, successMessage, redirectTo = "/" }: LoginFormProps) {
  const { formData, errors, isLoading, apiError, handleChange, handleSubmit } = useLoginForm(redirectTo);

  return (
    <div className="space-y-6">
      <LoginFormMessages
        successMessage={successMessage}
        errorMessage={errorMessage}
        apiError={apiError}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <LoginFormFields
          formData={formData}
          errors={errors}
          isLoading={isLoading}
          onChange={handleChange}
        />

        <LoginFormActions
          isLoading={isLoading}
          redirectTo={redirectTo}
        />
      </form>
    </div>
  );
});
