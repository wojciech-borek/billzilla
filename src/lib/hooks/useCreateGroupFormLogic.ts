import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { createGroupFormSchema } from "../schemas/groupSchemas";
import type { CreateGroupFormValues, CreateGroupSuccessResult } from "../schemas/groupSchemas";
import { useCreateGroupMutation } from "./useCreateGroupMutation";

interface UseCreateGroupFormLogicProps {
  onSuccess: (result: CreateGroupSuccessResult) => void;
}

interface UseCreateGroupFormLogicResult {
  form: UseFormReturn<CreateGroupFormValues>;
  onSubmit: (values: CreateGroupFormValues) => Promise<void>;
  mutationError: Error | null;
  fieldErrors: Record<string, string> | null;
  formRef: React.RefObject<HTMLFormElement | null>;
  firstErrorRef: React.RefObject<HTMLElement | null>;
}

/**
 * Custom hook that encapsulates the form logic for creating a group
 * Handles form state, validation, submission, focus management, and error handling
 */
export function useCreateGroupFormLogic({
  onSuccess,
}: UseCreateGroupFormLogicProps): UseCreateGroupFormLogicResult {
  const formRef = useRef<HTMLFormElement>(null);
  const firstErrorRef = useRef<HTMLElement | null>(null);

  const form = useForm({
    resolver: zodResolver(createGroupFormSchema),
    defaultValues: {
      name: "",
      base_currency_code: "PLN",
      invite_emails: [],
    },
  }) as UseFormReturn<CreateGroupFormValues>;

  const { createGroup, error: mutationError, fieldErrors } = useCreateGroupMutation();

  // Focus management: focus on first error when errors change
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      const firstErrorField = Object.keys(form.formState.errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.focus();
        firstErrorRef.current = element;
      }
    }
  }, [form.formState.errors]);

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
          form.setError(field as keyof CreateGroupFormValues, {
            type: "manual",
            message: message as string,
          });
        });
      }
    }
  };

  return {
    form,
    onSubmit,
    mutationError,
    fieldErrors,
    formRef,
    firstErrorRef,
  };
}
