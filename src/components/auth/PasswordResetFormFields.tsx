import { FormField } from "@/components/ui/form-field";
import type { RequestPasswordResetData } from "@/lib/schemas/authSchemas";

interface PasswordResetFormFieldsProps {
  formData: RequestPasswordResetData;
  errors: Record<string, string>;
  isLoading: boolean;
  onChange: (field: keyof RequestPasswordResetData, value: string) => void;
}

export function PasswordResetFormFields({ formData, errors, isLoading, onChange }: PasswordResetFormFieldsProps) {
  return (
    <FormField
      id="email"
      label="Adres e-mail"
      type="email"
      placeholder="twoj@email.com"
      value={formData.email || ""}
      onChange={(value) => onChange("email", value)}
      error={errors.email}
      disabled={isLoading}
      required
    />
  );
}
