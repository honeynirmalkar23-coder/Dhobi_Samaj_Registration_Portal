import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Resolver, SubmitHandler } from "react-hook-form";
import { OutlineButton, PrimaryButton } from "../../../components/common/Button";
import { FormField } from "../../../components/common/FormField";
import { useLanguage } from "../../language/LanguageContext";
import { registrationIdFormat } from "../../../lib/validation/registration-id";
import { statusSearchSchema } from "../schemas/status-search.schema";
import type { StatusSearchFormValues } from "../types/status-search.types";

type RegistrationStatusSearchFormProps = {
  initialRegistrationId: string;
  hasSearchAttempt: boolean;
  resetSignal: number;
  onSearch: (registrationId: string) => void;
  onInvalidSearch: () => void;
  onReset: () => void;
};

const inputId = "registration-status-search";

export function RegistrationStatusSearchForm({
  initialRegistrationId,
  hasSearchAttempt,
  resetSignal,
  onSearch,
  onInvalidSearch,
  onReset
}: RegistrationStatusSearchFormProps) {
  const { localized } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue
  } = useForm<StatusSearchFormValues>({
    defaultValues: {
      registrationId: initialRegistrationId
    },
    mode: "onSubmit",
    resolver: zodResolver(statusSearchSchema) as unknown as Resolver<StatusSearchFormValues>,
    shouldFocusError: true
  });
  const registrationIdField = register("registrationId");

  useEffect(() => {
    setValue("registrationId", initialRegistrationId, {
      shouldDirty: false,
      shouldValidate: false
    });
    clearErrors("registrationId");
  }, [clearErrors, initialRegistrationId, setValue]);

  useEffect(() => {
    if (resetSignal === 0) {
      return;
    }

    reset({ registrationId: "" });
    clearErrors();
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [clearErrors, reset, resetSignal]);

  const submitSearch: SubmitHandler<StatusSearchFormValues> = (values) => {
    reset({ registrationId: values.registrationId });
    onSearch(values.registrationId);
  };

  const resetSearch = () => {
    onReset();
  };

  return (
    <form
      className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-soft sm:p-6"
      noValidate
      onSubmit={handleSubmit(submitSearch, onInvalidSearch)}
      role="search"
    >
      <FormField
        error={errors.registrationId?.message}
        hint={localized(
          `पंजीकरण आईडी का प्रारूप ${registrationIdFormat} होना चाहिए।`,
          `Registration ID format should be ${registrationIdFormat}.`
        )}
        id={inputId}
        label={localized("पंजीकरण आईडी", "Registration ID")}
        required
      >
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brown-700/60"
          />
          <input
            aria-describedby={[
              `${inputId}-hint`,
              `${inputId}-privacy`,
              errors.registrationId ? `${inputId}-error` : null
            ]
              .filter(Boolean)
              .join(" ")}
            aria-invalid={Boolean(errors.registrationId)}
            className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/20 bg-white py-2.5 pl-10 pr-3 text-brown-900 placeholder:text-brown-700/55"
            id={inputId}
            placeholder={localized("उदाहरण: DS-2026-000001", "Example: DS-2026-000001")}
            type="search"
            {...registrationIdField}
            ref={(element) => {
              registrationIdField.ref(element);
              inputRef.current = element;
            }}
          />
        </div>
      </FormField>
      <p className="mt-3 text-sm leading-7 text-communityGreen-700" id={`${inputId}-privacy`}>
        {localized(
          "सार्वजनिक खोज में केवल सीमित स्थिति जानकारी दिखाई जाएगी।",
          "Only limited status information will be shown in public search."
        )}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <PrimaryButton type="submit">{localized("स्थिति देखें", "View status")}</PrimaryButton>
        {hasSearchAttempt ? (
          <OutlineButton onClick={resetSearch}>
            <RotateCcw aria-hidden="true" className="h-5 w-5" />
            {localized("नई खोज करें", "New search")}
          </OutlineButton>
        ) : null}
      </div>
    </form>
  );
}
