import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Resolver, SubmitHandler } from "react-hook-form";
import { FormField } from "../../../components/common/FormField";
import { PrimaryButton } from "../../../components/common/Button";
import { useLanguage } from "../../language/LanguageContext";
import { cn } from "../../../lib/cn";
import { adminLoginSchema } from "../schemas/admin-login.schema";
import type { AdminLoginFormValues, AdminLoginSubmitValues } from "../schemas/admin-login.schema";

type AdminLoginFormProps = {
  onSubmit: (values: AdminLoginSubmitValues) => Promise<void>;
};

const genericLoginError =
  "ईमेल या पासवर्ड सही नहीं है, अथवा आपको प्रशासनिक पहुंच प्राप्त नहीं है।";

const inputClasses =
  "focus-ring min-h-11 w-full rounded-md border border-maroon-700/20 bg-white px-3 py-2.5 text-brown-900 placeholder:text-brown-700/55";

export function AdminLoginForm({ onSubmit }: AdminLoginFormProps) {
  const { localized } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register
  } = useForm<AdminLoginFormValues>({
    defaultValues: {
      email: "",
      password: ""
    },
    resolver: zodResolver(adminLoginSchema) as unknown as Resolver<AdminLoginFormValues>
  });

  const submitLogin: SubmitHandler<AdminLoginFormValues> = async (values) => {
    setSubmitError(null);

    try {
      const parsedValues = adminLoginSchema.parse(values);
      await onSubmit(parsedValues);
    } catch {
      setSubmitError(localized(
        genericLoginError,
        "The email or password is incorrect, or you do not have administrator access."
      ));
    }
  };

  return (
    <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit(submitLogin)}>
      <FormField
        error={errors.email?.message}
        id="admin-email"
        label={localized("ईमेल पता", "Email address")}
        required
      >
        <input
          aria-describedby={errors.email ? "admin-email-error" : undefined}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          className={inputClasses}
          id="admin-email"
          placeholder={localized("प्रशासन ईमेल दर्ज करें", "Enter admin email")}
          type="email"
          {...register("email")}
        />
      </FormField>

      <FormField
        error={errors.password?.message}
        id="admin-password"
        label={localized("पासवर्ड", "Password")}
        required
      >
        <div className="relative">
          <input
            aria-describedby={errors.password ? "admin-password-error" : undefined}
            aria-invalid={Boolean(errors.password)}
            autoComplete="current-password"
            className={cn(inputClasses, "pr-12")}
            id="admin-password"
            placeholder={localized("पासवर्ड दर्ज करें", "Enter password")}
            type={showPassword ? "text" : "password"}
            {...register("password")}
          />
          <button
            aria-label={showPassword
              ? localized("पासवर्ड छिपाएं", "Hide password")
              : localized("पासवर्ड दिखाएं", "Show password")}
            className="focus-ring absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-brown-700 transition-colors hover:bg-cream-100"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Eye aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </FormField>

      {submitError ? (
        <p
          className="rounded-md border border-maroon-700/20 bg-maroon-50 px-3 py-2 text-sm font-semibold leading-7 text-maroon-800"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}

      <PrimaryButton className="w-full" disabled={isSubmitting} type="submit">
        <LockKeyhole aria-hidden="true" className="h-5 w-5" />
        {isSubmitting ? localized("लॉगिन किया जा रहा है…", "Logging in…") : localized("लॉगिन करें", "Log in")}
      </PrimaryButton>
    </form>
  );
}
