import { Button } from "@/components/ui/button";

interface LoginFormActionsProps {
  isLoading: boolean;
}

export function LoginFormActions({ isLoading }: LoginFormActionsProps) {
  return (
    <>
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

      {/* Link do rejestracji */}
      <p className="text-center text-sm text-gray-600">
        Nie masz konta?{" "}
        <a href="/signup" className="text-primary hover:text-primary-dark font-medium transition-colors duration-300">
          Zarejestruj się
        </a>
      </p>
    </>
  );
}
