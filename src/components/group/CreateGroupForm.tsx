import type { CreateGroupSuccessResult } from "../../lib/schemas/groupSchemas";
import { useCreateGroupFormLogic } from "../../lib/hooks/useCreateGroupFormLogic";
import CreateGroupFormErrors from "./CreateGroupFormErrors";
import CreateGroupFormFields from "./CreateGroupFormFields";
import CreateGroupFormActions from "./CreateGroupFormActions";

interface CreateGroupFormProps {
  onCancel: () => void;
  onSuccess: (result: CreateGroupSuccessResult) => void;
}

/**
 * Form component for creating a new group
 * Uses React Hook Form with Zod validation
 */
export default function CreateGroupForm({ onCancel, onSuccess }: CreateGroupFormProps) {
  const { form, onSubmit, mutationError, fieldErrors, formRef } = useCreateGroupFormLogic({
    onSuccess,
  });

  const { handleSubmit, formState: { isSubmitting } } = form;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
      aria-label="Formularz tworzenia nowej grupy"
      data-testid="create-group-form"
    >
      <CreateGroupFormErrors mutationError={mutationError} fieldErrors={fieldErrors} />

      <CreateGroupFormFields form={form} />

      <CreateGroupFormActions onCancel={onCancel} isSubmitting={isSubmitting} />
    </form>
  );
}
