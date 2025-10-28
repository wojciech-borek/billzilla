import { useEffect, memo } from "react";
import { useEmailVerification } from "@/lib/hooks/useEmailVerification";
import { EmailVerificationVerifying } from "./EmailVerificationVerifying";
import { EmailVerificationSuccess } from "./EmailVerificationSuccess";
import { EmailVerificationError } from "./EmailVerificationError";

interface EmailConfirmationMessageProps {
  tokenHash: string;
  nextUrl?: string;
}

export const EmailConfirmationMessage = memo(function EmailConfirmationMessage({
  tokenHash,
  nextUrl,
}: EmailConfirmationMessageProps) {
  const { state, error, verifyEmail } = useEmailVerification(tokenHash, nextUrl);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  if (state === "verifying") {
    return <EmailVerificationVerifying />;
  }

  if (state === "success") {
    return <EmailVerificationSuccess nextUrl={nextUrl} />;
  }

  if (state === "error" && error) {
    return <EmailVerificationError error={error} onRetry={verifyEmail} />;
  }

  return null;
});
