import { useState, useEffect, useCallback, memo } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupabaseAuth } from "@/lib/hooks";
import { getAuthErrorMessage, AUTH_SUCCESS_MESSAGES } from "@/lib/utils/authErrors";

interface EmailConfirmationMessageProps {
  tokenHash: string;
  nextUrl?: string;
}

type ConfirmationState = "verifying" | "success" | "error";

export const EmailConfirmationMessage = memo(function EmailConfirmationMessage({
  tokenHash,
  nextUrl,
}: EmailConfirmationMessageProps) {
  const [state, setState] = useState<ConfirmationState>("verifying");
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabaseAuth();

  const verifyEmail = useCallback(async () => {
    try {
      setState("verifying");

      // Weryfikuj token
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      });

      if (error) {
        setError(getAuthErrorMessage(error));
        setState("error");
        return;
      }

      // Sukces - ustaw stan sukcesu
      setState("success");

      // Automatyczne przekierowanie po krótkiej chwili
      setTimeout(() => {
        window.location.assign(nextUrl || "/");
      }, 3000);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setState("error");
    }
  }, [tokenHash, nextUrl, supabase.auth]);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  if (state === "verifying") {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Weryfikujemy Twój e-mail</h3>
          <p className="text-sm text-gray-600">To może potrwać chwilę...</p>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">🎉 {AUTH_SUCCESS_MESSAGES.emailConfirmed}</h3>
          <p className="text-sm text-gray-600 mb-4">Za chwilę zostaniesz przekierowany na stronę główną aplikacji.</p>
        </div>

        <Button
          onClick={() => window.location.assign(nextUrl || "/")}
          className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl transition-all duration-300 ease-out"
        >
          Przejdź do aplikacji
        </Button>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Weryfikacja nie powiodła się</h3>
        </div>

        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button
            onClick={verifyEmail}
            className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl transition-all duration-300 ease-out"
          >
            Spróbuj ponownie
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.assign("/signup")}
            className="w-full rounded-xl border-2 border-gray-200 hover:border-primary transition-all duration-300 ease-out"
          >
            Powrót do rejestracji
          </Button>
        </div>
      </div>
    );
  }

  return null;
});
