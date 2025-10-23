import { useState, useCallback, memo, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { GoogleOAuthButton } from "./GoogleOAuthButton";
import { useAuthForm, useSupabaseAuth } from "@/lib/hooks";
import { signupSchema, type SignupFormData } from "@/lib/schemas/authSchemas";
import { getAuthErrorMessage, AUTH_SUCCESS_MESSAGES } from "@/lib/utils/authErrors";

interface SignupFormProps {
  successMessage?: string;
  errorMessage?: string;
}

export const SignupForm = memo(function SignupForm({ successMessage, errorMessage }: SignupFormProps) {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { formData, errors, isLoading, apiError, setIsLoading, setApiError, handleChange, validate } =
    useAuthForm<SignupFormData>(signupSchema);
  const { signUp } = useSupabaseAuth();

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!validate()) return;

      setIsLoading(true);
      setApiError(null);
      setShowSuccessMessage(false);

      try {
        const { error } = await signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { full_name: formData.full_name } },
        });

        if (error) {
          setApiError(getAuthErrorMessage(error));
          return;
        }

        if (import.meta.env.DEV) console.log("✅ Rejestracja pomyślna!");
        setShowSuccessMessage(true);
      } catch (err) {
        if (import.meta.env.DEV) console.error("Błąd rejestracji:", err);
        setApiError(getAuthErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [
      formData.email,
      formData.password,
      formData.full_name,
      setApiError,
      setIsLoading,
      setShowSuccessMessage,
      signUp,
      validate,
    ]
  );

  return (
    <div className="space-y-6">
      {/* Wyświetl komunikat sukcesu z URL jeśli istnieje */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <p className="text-sm">{successMessage}</p>
        </Alert>
      )}

      {/* Wyświetl komunikat sukcesu po rejestracji */}
      {showSuccessMessage && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <p className="text-sm font-medium mb-2">🎉 {AUTH_SUCCESS_MESSAGES.signup}</p>
          <p className="text-xs text-green-700">Jeśli nie widzisz e-maila, sprawdź folder spam lub spróbuj ponownie.</p>
        </Alert>
      )}

      {/* Wyświetl błąd z URL jeśli istnieje */}
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

      {/* Formularz rejestracji */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nazwa użytkownika (przyjazne pole) */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-sm font-medium text-foreground">
            Jak mamy Cię nazywać?
          </Label>
          <Input
            id="full_name"
            type="text"
            placeholder="np. Janusz123, Kasia, MonsterSlayer"
            value={formData.full_name || ""}
            onChange={(e) => handleChange("full_name", e.target.value)}
            className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/40"
            disabled={isLoading}
            aria-invalid={!!errors.full_name}
            aria-describedby={errors.full_name ? "full_name-error" : undefined}
          />
          {errors.full_name && (
            <p id="full_name-error" className="text-sm text-red-600 flex items-start gap-1" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{errors.full_name}</span>
            </p>
          )}
          <p className="text-xs text-gray-500">Możesz podać swoje imię, pseudonim, login - co wolisz!</p>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Adres e-mail
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="twoj@email.com"
            value={formData.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/40"
            disabled={isLoading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-600 flex items-start gap-1" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Hasło */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Hasło
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password || ""}
            onChange={(e) => handleChange("password", e.target.value)}
            className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/40"
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
          <p className="text-xs text-gray-500">Minimum 8 znaków, w tym cyfra i litera</p>
        </div>

        {/* Potwierdzenie hasła */}
        <div className="space-y-2">
          <Label htmlFor="confirm_password" className="text-sm font-medium text-foreground">
            Powtórz hasło
          </Label>
          <Input
            id="confirm_password"
            type="password"
            placeholder="••••••••"
            value={formData.confirm_password || ""}
            onChange={(e) => handleChange("confirm_password", e.target.value)}
            className="rounded-lg border-gray-200 focus:border-primary focus:ring-primary/40"
            disabled={isLoading}
            aria-invalid={!!errors.confirm_password}
            aria-describedby={errors.confirm_password ? "confirm_password-error" : undefined}
          />
          {errors.confirm_password && (
            <p id="confirm_password-error" className="text-sm text-red-600 flex items-start gap-1" role="alert">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{errors.confirm_password}</span>
            </p>
          )}
        </div>

        {/* Przycisk rejestracji */}
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
