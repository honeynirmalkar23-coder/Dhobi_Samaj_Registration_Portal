import type { FormEvent } from "react";
import { Search } from "lucide-react";
import { PrimaryButton } from "./Button";
import { cn } from "../../lib/cn";

type SearchInputProps = {
  id: string;
  label: string;
  placeholder?: string;
  buttonLabel?: string;
  disabled?: boolean;
  value?: string;
  defaultValue?: string;
  helperText?: string;
  privacyNote?: string;
  error?: string | null;
  onChange?: (value: string) => void;
  className?: string;
  onSubmit?: (value: string) => void;
};

export function SearchInput({
  id,
  label,
  placeholder = "खोजें",
  buttonLabel = "खोजें",
  disabled = false,
  value,
  defaultValue,
  helperText,
  privacyNote,
  error,
  onChange,
  className,
  onSubmit
}: SearchInputProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disabled || !onSubmit) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const value = String(formData.get(id) ?? "").trim();
    onSubmit(value);
  };

  return (
    <form className={cn("w-full", className)} onSubmit={handleSubmit} role="search">
      <label className="mb-2 block text-sm font-semibold text-brown-800" htmlFor={id}>
        {label}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brown-700/60"
          />
          <input
            aria-describedby={
              [
                helperText ? `${id}-helper` : null,
                privacyNote ? `${id}-privacy` : null,
                error ? `${id}-error` : null
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            aria-invalid={Boolean(error)}
            className={cn(
              "focus-ring min-h-11 w-full rounded-md border bg-white py-2.5 pl-10 pr-3 text-brown-900 placeholder:text-brown-700/55 disabled:cursor-not-allowed disabled:bg-cream-100 disabled:text-brown-700",
              error ? "border-maroon-700" : "border-maroon-700/20"
            )}
            defaultValue={defaultValue}
            disabled={disabled}
            id={id}
            name={id}
            onChange={(event) => onChange?.(event.currentTarget.value)}
            placeholder={placeholder}
            type="search"
            value={value}
          />
        </div>
        <PrimaryButton disabled={disabled || !onSubmit} type="submit">
          {buttonLabel}
        </PrimaryButton>
      </div>
      {helperText ? (
        <p className="mt-3 text-sm leading-7 text-brown-700" id={`${id}-helper`}>
          {helperText}
        </p>
      ) : null}
      {privacyNote ? (
        <p className="mt-2 text-sm leading-7 text-communityGreen-700" id={`${id}-privacy`}>
          {privacyNote}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-2 text-sm font-semibold leading-7 text-maroon-700"
          id={`${id}-error`}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
