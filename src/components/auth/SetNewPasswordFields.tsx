import { FormField } from "@/components/ui/form-field";
import type { SetNewPasswordData } from "@/lib/schemas/authSchemas";

interface SetNewPasswordFieldsProps {
  formData: SetNewPasswordData;
  errors: Record<string, string>;
  isLoading: boolean;
  onChange: (field: keyof SetNewPasswordData, value: unknown) => void;
}

export function SetNewPasswordFields({ formData, errors, isLoading, onChange }: SetNewPasswordFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        id="new_password"
        label="Nowe hasło"
        type="password"
        placeholder="••••••••"
        value={formData.new_password || ""}
        onChange={(value) => onChange("new_password", value)}
        error={errors.new_password}
        helperText="Minimum 8 znaków, w tym cyfra i litera"
        disabled={isLoading}
        required
      />

      <FormField
        id="confirm_password"
        label="Powtórz nowe hasło"
        type="password"
        placeholder="••••••••"
        value={formData.confirm_password || ""}
        onChange={(value) => onChange("confirm_password", value)}
        error={errors.confirm_password}
        disabled={isLoading}
        required
      />
    </div>
  );
}
