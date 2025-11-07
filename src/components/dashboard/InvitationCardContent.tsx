import type { InvitationCardVM } from "./types";
import { formatInvitationDate } from "@/lib/utils/dateFormatting";

interface InvitationCardContentProps {
  invitation: InvitationCardVM;
}

/**
 * Content section of the invitation card - icon and text
 */
export default function InvitationCardContent({ invitation }: InvitationCardContentProps) {
  const formattedDate = invitation.createdAt ? formatInvitationDate(invitation.createdAt) : null;

  return (
    <>
      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/20">
        <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h3 className="truncate text-sm font-medium text-foreground">{invitation.groupName}</h3>
        <p className="text-xs text-muted-foreground">
          {invitation.invitationType === "existing_user"
            ? "Zaproszenie do dołączenia do grupy"
            : "Zaproszenie do rejestracji i dołączenia do grupy"}
          {formattedDate && <span className="ml-1">• {formattedDate}</span>}
        </p>
      </div>
    </>
  );
}
