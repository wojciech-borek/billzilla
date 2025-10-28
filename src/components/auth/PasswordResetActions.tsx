import { Button } from "@/components/ui/button";

interface PasswordResetActionsProps {
  isLoading: boolean;
}

export function PasswordResetActions({ isLoading }: PasswordResetActionsProps) {
  return (
    <>
      {/* Submit button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl transition-all duration-300 ease-out"
      >
        {isLoading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Wysyłanie...
          </>
        ) : (
          "Wyślij link resetujący"
        )}
      </Button>

      {/* Link back to login */}
      <p className="text-center text-sm text-gray-600">
        Pamiętasz hasło?{" "}
        <a href="/login" className="text-primary hover:text-primary-dark font-medium transition-colors duration-300">
          Wróć do logowania
        </a>
      </p>
    </>
  );
}
