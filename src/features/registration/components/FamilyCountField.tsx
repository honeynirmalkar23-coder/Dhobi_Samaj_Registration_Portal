import { Minus, Plus } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormField } from "../../../components/common/FormField";
import { cn } from "../../../lib/cn";
import type { RegistrationFormInputValues } from "../types/registration-form.types";
import {
  blockInvalidNumberKey,
  parseIntegerField,
  registrationFieldIds
} from "../utilities/registration-form.utils";

type FamilyCountFieldProps = {
  name: "boysCount" | "girlsCount" | "eldersCount";
  label: string;
  decrementLabel: string;
  incrementLabel: string;
  error?: string | undefined;
};

export function FamilyCountField({
  name,
  label,
  decrementLabel,
  incrementLabel,
  error
}: FamilyCountFieldProps) {
  const { register, setValue } = useFormContext<RegistrationFormInputValues>();
  const value = String(
    useWatch<RegistrationFormInputValues>({
      name
    }) ?? "0"
  );
  const numericValue = parseIntegerField(value) ?? 0;
  const inputId = registrationFieldIds[name];

  const updateValue = (nextValue: number) => {
    setValue(name, String(Math.min(99, Math.max(0, nextValue))), {
      shouldDirty: true,
      shouldValidate: true
    });
  };

  return (
    <FormField error={error} id={inputId} label={label} required>
      <div className="flex min-w-0 items-center gap-2">
        <button
          aria-label={decrementLabel}
          className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-maroon-700/20 bg-white text-maroon-800 transition-colors hover:bg-maroon-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={numericValue <= 0}
          onClick={() => updateValue(numericValue - 1)}
          type="button"
        >
          <Minus aria-hidden="true" className="h-5 w-5" />
        </button>
        <input
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-invalid={Boolean(error)}
          className={cn(
            "focus-ring min-h-11 min-w-0 flex-1 rounded-md border border-maroon-700/20 bg-white px-3 py-2.5 text-center text-brown-900"
          )}
          id={inputId}
          inputMode="numeric"
          max={99}
          min={0}
          onKeyDown={blockInvalidNumberKey}
          type="number"
          {...register(name)}
        />
        <button
          aria-label={incrementLabel}
          className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-maroon-700/20 bg-white text-maroon-800 transition-colors hover:bg-maroon-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={numericValue >= 99}
          onClick={() => updateValue(numericValue + 1)}
          type="button"
        >
          <Plus aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
    </FormField>
  );
}
