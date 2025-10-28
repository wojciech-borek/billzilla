import type { UseFormReturn } from "react-hook-form";
import type { CreateGroupFormValues } from "../../lib/schemas/groupSchemas";
import NameField from "./NameField";
import BaseCurrencySelect from "./BaseCurrencySelect";
import InviteEmailsInput from "./InviteEmailsInput";

interface CreateGroupFormFieldsProps {
  form: UseFormReturn<CreateGroupFormValues>;
}

/**
 * Component containing all form fields for creating a group
 */
export default function CreateGroupFormFields({ form }: CreateGroupFormFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <>
      <NameField register={register} errors={errors} />

      <BaseCurrencySelect control={control} errors={errors} />

      <InviteEmailsInput control={control} errors={errors} />
    </>
  );
}
