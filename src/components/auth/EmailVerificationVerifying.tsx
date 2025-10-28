import { Loader2 } from "lucide-react";

export function EmailVerificationVerifying() {
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
