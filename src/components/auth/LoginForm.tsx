import { memo, useCallback, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { GoogleOAuthButton } from "./GoogleOAuthButton";
import { useAuthForm, useSupabaseAuth } from "@/lib/hooks";
import { loginSchema, type LoginFormData } from "@/lib/schemas/authSchemas";
import { getAuthErrorMessage, AUTH_SUCCESS_MESSAGES } from "@/lib/utils/authErrors";

interface LoginFormProps {
  errorMessage?: string;
  successMessage?: string;
  redirectTo?: string;
}

export const LoginForm = memo(function LoginForm({ errorMessage, successMessage, redirectTo = "/" }: LoginFormProps) {
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
        const { error } = await signIn({ email: formData.email!, password: formData.password! });
        if (error) {
          setApiError(getAuthErrorMessage(error));
          setIsLoading(false);
          return;
        }
        window.location.href = redirectTo;
      } catch (err) {
        if (import.meta.env.DEV) console.error("Błąd logowania:", err);
        setApiError(getAuthErrorMessage(err));
        setIsLoading(false);
      }
    },
    [formData.email, formData.password, redirectTo, setApiError, setIsLoading, signIn, validate]
  );

  return (
    <div className="space-y-6">
      {/* Wyświetl komunikat sukcesu z URL jeśli istnieje (np. po resetowaniu hasła) */}
      {successMessage === "password_changed" && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription className="text-green-800">
            {AUTH_SUCCESS_MESSAGES.passwordChanged}
          </AlertDescription>
        </Alert>
      )}

      {/* Wyświetl błąd z URL jeśli istnieje (np. po OAuth callback) */}
      {errorMessage && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Wyświetl błąd API */}
      {apiError && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{apiError}</AlertDescription>
        </Alert>
      )}

      {/* Formularz logowania */}
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Pole hasła z linkiem resetowania */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Hasło
              <span className="text-red-500 ml-1">*</span>
            </label>
            <a
              href="/reset-password"
              className="text-xs text-primary hover:text-primary-dark transition-colors duration-300"
            >
              Zapomniałeś hasła?
            </a>
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password || ""}
            onChange={(e) => handleChange("password", e.target.value)}
            className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-red-600 flex items-start gap-1" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Przycisk logowania */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl transition-all duration-300 ease-out"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Trwa logowanie...
            </>
          ) : (
            "Zaloguj się"
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
      <GoogleOAuthButton mode="login" redirectTo={redirectTo} />

      {/* Link do rejestracji */}
      <p className="text-center text-sm text-gray-600">
        Nie masz konta?{" "}
        <a href="/signup" className="text-primary hover:text-primary-dark font-medium transition-colors duration-300">
          Zarejestruj się
        </a>
      </p>
    </div>
  );
});
