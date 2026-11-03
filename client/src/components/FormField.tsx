import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
};

// A label, an input and its error message, linked together for screen readers.
export function FormField({ id, label, error, ...inputProps }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
