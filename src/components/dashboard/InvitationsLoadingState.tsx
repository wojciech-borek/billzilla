/**
 * Loading state component for invitations section
 */
export default function InvitationsLoadingState() {
  return (
    <section aria-labelledby="invitations-heading">
      <h2 id="invitations-heading" className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Zaproszenia
      </h2>
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/50" aria-hidden="true" />
        ))}
      </div>
    </section>
  );
}
