import { StatusMessage } from "@/components/ui/status-message";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AUTH_SUCCESS_MESSAGES } from "@/lib/utils/authErrors";

interface PasswordResetMessagesProps {
  showSuccessMessage: boolean;
  errorMessage?: string;
  resetError?: string | null;
}

export function PasswordResetMessages({ showSuccessMessage, errorMessage, resetError }: PasswordResetMessagesProps) {
  return (
    <>
      {/* Success message */}
      {showSuccessMessage && (
        <StatusMessage
          type="success"
          title={AUTH_SUCCESS_MESSAGES.passwordResetRequested}
          message="Sprawdź swoją skrzynkę e-mail i kliknij w link, aby zresetować hasło."
        />
      )}

      {/* Error from URL */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* API error */}
      {resetError && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{resetError}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
