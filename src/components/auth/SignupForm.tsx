import { useCallback, memo, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FormField } from "@/components/ui/form-field";
import { StatusMessage } from "@/components/ui/status-message";
import { GoogleOAuthButton } from "./GoogleOAuthButton";
import { useAuthForm, useSignup } from "@/lib/hooks";
import { signupSchema, type SignupFormData } from "@/lib/schemas/authSchemas";

interface SignupFormProps {
  successMessage?: string;
  errorMessage?: string;
}

export const SignupForm = memo(function SignupForm({ successMessage, errorMessage }: SignupFormProps) {
  const { formData, errors, isLoading, handleChange, validate } = useAuthForm<SignupFormData>(signupSchema);
  const { signup, isSuccess, error: signupError } = useSignup();

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!validate()) return;

      await signup(formData);
    },
    [formData, signup, validate]
  );

  return (
    <div className="space-y-6">
      {/* Status messages */}
      {successMessage && <StatusMessage type="info" message={successMessage} />}

      {isSuccess && (
        <StatusMessage
          type="success"
          title="Konto zostało utworzone pomyślnie!"
          message="Sprawdź swoją skrzynkę e-mail i kliknij w link aktywacyjny, aby dokończyć rejestrację. Jeśli nie widzisz wiadomości, sprawdź folder spam."
        />
      )}

      {errorMessage && <StatusMessage type="error" message={errorMessage} />}

      {signupError && <StatusMessage type="error" message={signupError} />}

      {/* Registration form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          id="full_name"
          label="Jak mamy Cię nazywać?"
          type="text"
          placeholder="np. Janusz123, Kasia, MonsterSlayer"
          value={formData.full_name || ""}
          onChange={(value) => handleChange("full_name", value)}
          error={errors.full_name}
          helperText="Możesz podać swoje imię, pseudonim, login - co wolisz!"
          disabled={isLoading}
          required
        />

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

        <FormField
          id="password"
          label="Hasło"
          type="password"
          placeholder="••••••••"
          value={formData.password || ""}
          onChange={(value) => handleChange("password", value)}
          error={errors.password}
          helperText="Minimum 8 znaków, w tym cyfra i litera"
          disabled={isLoading}
          required
        />

        <FormField
          id="confirm_password"
          label="Powtórz hasło"
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
              Trwa rejestracja...
            </>
          ) : (
            "Zarejestruj się"
          )}
        </Button>
      </form>

      {/* Separator */}
      <div className="relative">
        <Separator className="bg-gray-200" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-500">
          lub
        </span>
      </div>

      {/* Google OAuth */}
      <GoogleOAuthButton mode="signup" />

      {/* Link do logowania */}
      <p className="text-center text-sm text-gray-600">
        Masz już konto?{" "}
        <a href="/login" className="text-primary hover:text-primary-dark font-medium transition-colors duration-300">
          Zaloguj się
        </a>
      </p>
    </div>
  );
});
