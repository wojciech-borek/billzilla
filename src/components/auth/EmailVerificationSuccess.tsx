import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AUTH_SUCCESS_MESSAGES } from "@/lib/utils/authErrors";

interface EmailVerificationSuccessProps {
  nextUrl?: string;
}

export function EmailVerificationSuccess({ nextUrl }: EmailVerificationSuccessProps) {
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
