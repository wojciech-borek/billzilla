import { Alert, AlertDescription } from "@/components/ui/alert";

interface SetNewPasswordMessagesProps {
  successMessage?: string;
  errorMessage?: string;
  setPasswordError?: string | null;
}

export function SetNewPasswordMessages({
  successMessage,
  errorMessage,
  setPasswordError,
}: SetNewPasswordMessagesProps) {
  return (
    <>
      {/* Komunikat sukcesu z URL */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription className="text-sm">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Błąd z URL */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Błąd API */}
      {setPasswordError && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{setPasswordError}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
