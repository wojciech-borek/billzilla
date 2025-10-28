import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailVerificationErrorProps {
  error: string;
  onRetry: () => void;
}

export function EmailVerificationError({ error, onRetry }: EmailVerificationErrorProps) {
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
          onClick={onRetry}
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
