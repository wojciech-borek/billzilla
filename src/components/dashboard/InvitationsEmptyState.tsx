import SectionEmptyState from "./SectionEmptyState";

/**
 * Empty state component for invitations section
 */
export default function InvitationsEmptyState() {
  return (
    <section aria-labelledby="invitations-heading">
      <h2 id="invitations-heading" className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Zaproszenia
      </h2>
      <SectionEmptyState title="Brak zaproszeń" description="Nie masz żadnych oczekujących zaproszeń do grup." />
    </section>
  );
}
