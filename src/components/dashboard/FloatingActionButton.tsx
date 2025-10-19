import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onClick: () => void;
}

/**
 * Floating Action Button for creating a new group
 * Fixed position at bottom-right corner, icon-only design
 */
export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg shadow-green-200 transition-all duration-300 ease-out hover:scale-110 hover:shadow-xl hover:shadow-green-300 focus-visible:scale-110 focus-visible:shadow-xl"
      aria-label="Utwórz nową grupę"
      title="Utwórz nową grupę"
    >
      {/* Plus icon */}
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    </Button>
  );
}
