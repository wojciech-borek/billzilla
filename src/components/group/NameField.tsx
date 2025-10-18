import { Label } from '../ui/label';
import { Input } from '../ui/input';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { CreateGroupFormValues } from '../../lib/schemas/groupSchemas';

type NameFieldProps = {
  register: UseFormRegister<CreateGroupFormValues>;
  errors: FieldErrors<CreateGroupFormValues>;
};

/**
 * Name field component for group creation form
 * Validates: required, 1-100 characters
 */
export default function NameField({ register, errors }: NameFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="name" className="text-foreground font-medium">
        Nazwa grupy <span className="text-destructive">*</span>
      </Label>
      <Input
        id="name"
        type="text"
        placeholder="np. Wakacje w Hiszpanii, Mieszkanie 2024"
        className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
        aria-invalid={errors.name ? 'true' : 'false'}
        aria-describedby={errors.name ? 'name-error' : undefined}
        {...register('name')}
      />
      {errors.name && (
        <p id="name-error" className="text-sm text-destructive" role="alert">
          {errors.name.message}
        </p>
      )}
    </div>
  );
}

