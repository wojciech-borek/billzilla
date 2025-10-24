import { useState } from "react";
import type { ZodSchema } from "zod";

export function useAuthForm<T extends Record<string, unknown>>(schema: ZodSchema<T>) {
  const [formData, setFormData] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleChange = (field: keyof T, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
    if (apiError) setApiError(null);
  };

  const reset = () => {
    setFormData({});
    setErrors({});
    setApiError(null);
    setIsLoading(false);
  };

  return {
    formData: formData as T,
    errors,
    isLoading,
    apiError,
    setIsLoading,
    setApiError,
    handleChange,
    validate,
    reset,
  };
}
