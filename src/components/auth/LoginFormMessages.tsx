import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AUTH_SUCCESS_MESSAGES } from "@/lib/utils/authErrors";

interface LoginFormMessagesProps {
  successMessage?: string;
  errorMessage?: string;
  apiError?: string | null;
}

export function LoginFormMessages({ successMessage, errorMessage, apiError }: LoginFormMessagesProps) {
  return (
    <>
      {/* Wyświetl komunikat sukcesu z URL jeśli istnieje (np. po resetowaniu hasła) */}
      {successMessage === "password_changed" && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription className="text-green-800">{AUTH_SUCCESS_MESSAGES.passwordChanged}</AlertDescription>
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
    </>
  );
}
