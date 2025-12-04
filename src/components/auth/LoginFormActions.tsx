import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
// import { GoogleOAuthButton } from "./GoogleOAuthButton";

interface LoginFormActionsProps {
  isLoading: boolean;
  redirectTo: string;
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

      {/* Separator */}
      <div className="relative">
        <Separator className="bg-gray-200" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-500">
          lub
        </span>
      </div>

      {/* Google OAuth */}
      {/* <GoogleOAuthButton mode="login" redirectTo={redirectTo} /> */}

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
