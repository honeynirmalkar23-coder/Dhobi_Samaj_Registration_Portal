import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type FormFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean;
  className?: string | undefined;
};

export function FormField({
  id,
  label,
  children,
  hint,
  error,
  required = false,
  className
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-semibold text-brown-800" htmlFor={id}>
        {label}
        {required ? <span className="text-maroon-700"> *</span> : null}
      </label>
      {children}
      {hint ? (
        <p className="text-xs leading-6 text-brown-700" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          className="text-sm font-medium leading-6 text-maroon-700"
          id={`${id}-error`}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
