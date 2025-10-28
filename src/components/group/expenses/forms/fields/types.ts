import type { UseFormReturn } from "react-hook-form";
import type { CreateExpenseFormValues } from "@/lib/schemas/expenseSchemas";

export interface FieldProps {
  form: UseFormReturn<CreateExpenseFormValues>;
  hasLowConfidence?: boolean;
}
