import { Button } from "@/components/ui/button";

interface SectionEmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Empty state component for dashboard sections
 * Shows a message when a section has no data
 */
export default function SectionEmptyState({ title, description, action }: SectionEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted bg-card p-12 text-center">
      <div className="mx-auto max-w-md">
        <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
        {description && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>}
        {action && (
          <Button onClick={action.onClick} className="mt-6" variant="outline">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
