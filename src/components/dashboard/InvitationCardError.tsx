interface InvitationCardErrorProps {
  error: string;
}

/**
 * Error message display for invitation card
 */
export default function InvitationCardError({ error }: InvitationCardErrorProps) {
  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-1 rounded-md bg-destructive/10 p-2 border border-destructive/20"
      role="alert"
    >
      <p className="text-xs text-destructive font-medium">{error}</p>
    </div>
  );
}
