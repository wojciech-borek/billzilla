import { Button } from "@/components/ui/button";

interface SetNewPasswordActionsProps {
  isLoading: boolean;
}

export function SetNewPasswordActions({ isLoading }: SetNewPasswordActionsProps) {
  return (
    <Button
      type="submit"
      disabled={isLoading}
      className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl transition-all duration-300 ease-out"
    >
      {isLoading ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Zmiana hasła...
        </>
      ) : (
        "Ustaw nowe hasło"
      )}
    </Button>
  );
}
