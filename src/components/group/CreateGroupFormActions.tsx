import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface CreateGroupFormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Component containing action buttons for the create group form
 */
export default function CreateGroupFormActions({ onCancel, isSubmitting }: CreateGroupFormActionsProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        className="w-full sm:w-auto"
        data-testid="cancel-create-group"
      >
        Anuluj
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-primary-foreground"
        data-testid="submit-create-group"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Tworzenie...
          </>
        ) : (
          "Utwórz grupę"
        )}
      </Button>
    </div>
  );
}
