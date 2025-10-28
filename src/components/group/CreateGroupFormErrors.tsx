import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";

interface CreateGroupFormErrorsProps {
  mutationError: Error | null;
  fieldErrors: Record<string, string> | null;
}

/**
 * Component for displaying form-level errors in the create group form
 */
export default function CreateGroupFormErrors({ mutationError, fieldErrors }: CreateGroupFormErrorsProps) {
  // Only show form-level error if there are no field-specific errors
  if (mutationError && !fieldErrors) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>{mutationError.message}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
