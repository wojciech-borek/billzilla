import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { createGroupFormSchema } from "../../lib/schemas/groupSchemas";
import type { CreateGroupFormValues, CreateGroupSuccessResult } from "../../lib/schemas/groupSchemas";
import { useCreateGroupMutation } from "../../lib/hooks/useCreateGroupMutation";
import NameField from "./NameField";
import BaseCurrencySelect from "./BaseCurrencySelect";
import InviteEmailsInput from "./InviteEmailsInput";

interface CreateGroupFormProps {
  onCancel: () => void;
  onSuccess: (result: CreateGroupSuccessResult) => void;
}

/**
 * Form component for creating a new group
 * Uses React Hook Form with Zod validation
 */
export default function CreateGroupForm({ onCancel, onSuccess }: CreateGroupFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const firstErrorRef = useRef<HTMLElement | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupFormSchema),
    defaultValues: {
      name: "",
      base_currency_code: "PLN",
      invite_emails: [],
    },
  });

  const { createGroup, error: mutationError, fieldErrors } = useCreateGroupMutation();

  // Focus management: focus on first error when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.focus();
        firstErrorRef.current = element;
      }
    }
  }, [errors]);

  const onSubmit = async (values: CreateGroupFormValues) => {
    try {
      const response = await createGroup(values);

      // Transform response to success result
      const result: CreateGroupSuccessResult = {
        groupId: response.id,
        groupName: response.name,
        baseCurrency: response.base_currency_code,
        invitations: response.invitations,
      };

      onSuccess(result);
    } catch (err) {
      // Field errors are already handled by the mutation hook
      // Set field errors from API if available
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as keyof CreateGroupFormValues, {
            type: "manual",
            message: message as string,
          });
        });
      }
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
      aria-label="Formularz tworzenia nowej grupy"
    >
      {/* Form-level error */}
      {mutationError && !fieldErrors && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{mutationError.message}</AlertDescription>
        </Alert>
      )}

      {/* Form fields */}
      <NameField register={register} errors={errors} />

      <BaseCurrencySelect control={control} errors={errors} />

      <InviteEmailsInput control={control} errors={errors} />

      {/* Action buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto">
          Anuluj
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-primary-foreground"
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
    </form>
  );
}
