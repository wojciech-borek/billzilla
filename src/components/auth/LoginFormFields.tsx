import { AlertCircle } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import type { LoginFormData } from "@/lib/schemas/authSchemas";

interface LoginFormFieldsProps {
  formData: LoginFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  onChange: (field: keyof LoginFormData, value: string) => void;
}

export function LoginFormFields({ formData, errors, isLoading, onChange }: LoginFormFieldsProps) {
  return (
    <div className="space-y-4">
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

      {/* Pole hasła z linkiem resetowania */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-semibold tracking-tight text-foreground">
            Hasło
            <span className="text-red-500 ml-1">*</span>
          </label>
          <a
            href="/reset-password"
            className="text-xs text-primary hover:text-primary-dark transition-colors duration-300"
          >
            Zapomniałeś hasła?
          </a>
        </div>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={formData.password || ""}
          onChange={(e) => onChange("password", e.target.value)}
          className="flex h-10 w-full rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm font-normal shadow-sm shadow-gray-100/50 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-red-600 flex items-start gap-1" role="alert">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{errors.password}</span>
          </p>
        )}
      </div>
    </div>
  );
}
