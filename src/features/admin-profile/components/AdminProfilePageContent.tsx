import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  UserCog
} from "lucide-react";
import { useForm } from "react-hook-form";
import type { FieldErrors, Resolver, SubmitErrorHandler, SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { OutlineButton, PrimaryButton, SecondaryButton } from "../../../components/common/Button";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { DevelopmentNotice } from "../../../components/common/DevelopmentNotice";
import { ErrorState } from "../../../components/common/ErrorState";
import { FormField } from "../../../components/common/FormField";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { PageHeader } from "../../../components/common/PageHeader";
import { routePaths } from "../../../config/routes.config";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { cn } from "../../../lib/cn";
import {
  loadAdminProfile,
  saveAdminProfile
} from "../../../services/admin-profile.service";
import type { AdminProfileDetails } from "../../../services/admin-profile.service";
import { useAdminAuth } from "../../admin-auth/hooks/useAdminAuth";
import { useLanguage } from "../../language/LanguageContext";
import { adminProfileSchema } from "../schemas/admin-profile.schema";
import type {
  AdminProfileFormValues,
  AdminProfileSubmitValues
} from "../schemas/admin-profile.schema";

const inputClasses =
  "focus-ring min-h-11 w-full rounded-md border border-maroon-700/20 bg-white px-3 py-2.5 text-brown-900 placeholder:text-brown-700/55";

const adminProfileDefaults: AdminProfileFormValues = {
  confirmNewPassword: "",
  currentPassword: "",
  displayName: "",
  email: "",
  newPassword: ""
};

type PasswordFieldName = "currentPassword" | "newPassword" | "confirmNewPassword";

function mapProfileToFormValues(profile: AdminProfileDetails): AdminProfileFormValues {
  return {
    confirmNewPassword: "",
    currentPassword: "",
    displayName: profile.displayName,
    email: profile.email,
    newPassword: ""
  };
}

function getModeLabel(mode: AdminProfileDetails["authenticationMode"], english: boolean): string {
  if (mode === "local-dev") {
    return english ? "Local development" : "स्थानीय विकास";
  }

  return english ? "Supabase Auth" : "Supabase Auth";
}

export function AdminProfilePageContent() {
  const { identity, refreshSession } = useAdminAuth();
  const { language, localized } = useLanguage();
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const [profile, setProfile] = useState<AdminProfileDetails | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [showSaveSuccessDialog, setShowSaveSuccessDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [saveSuccessDescription, setSaveSuccessDescription] = useState("");
  const [emailChangePending, setEmailChangePending] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const {
    clearErrors,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    setFocus
  } = useForm<AdminProfileFormValues>({
    defaultValues: adminProfileDefaults,
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(adminProfileSchema) as unknown as Resolver<AdminProfileFormValues>,
    shouldFocusError: false
  });
  const hasErrors = Object.keys(errors).length > 0;
  const isLocalDevProfile = profile?.authenticationMode === "local-dev";
  const showSaveSuccessDetails = emailChangePending || passwordChanged || isLocalDevProfile;

  useUnsavedChanges(isDirty);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!identity) {
        setServerError(localized("प्रशासन सत्र उपलब्ध नहीं है।", "The admin session is not available."));
        setLoadState("error");
        return;
      }

      setLoadState("loading");
      const result = await loadAdminProfile(identity);

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setServerError(result.message);
        setLoadState("error");
        return;
      }

      setProfile(result.data);
      reset(mapProfileToFormValues(result.data));
      setServerError(null);
      setLoadState("loaded");
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [identity?.authenticationMode, identity?.email, reset]);

  const focusFirstError = (submitErrors: FieldErrors<AdminProfileFormValues>) => {
    const fieldOrder: Array<keyof AdminProfileFormValues> = [
      "displayName",
      "email",
      "currentPassword",
      "newPassword",
      "confirmNewPassword"
    ];
    const firstErrorName = fieldOrder.find((fieldName) => fieldName in submitErrors);

    if (firstErrorName) {
      setFocus(firstErrorName);
    }
  };

  const handleInvalidSubmit: SubmitErrorHandler<AdminProfileFormValues> = (submitErrors) => {
    window.setTimeout(() => focusFirstError(submitErrors), 0);
  };

  const resetToProfile = () => {
    if (!profile) {
      return;
    }

    reset(mapProfileToFormValues(profile));
    clearErrors();
    setServerError(null);
    setShowResetDialog(false);
    window.setTimeout(() => setFocus("displayName"), 0);
  };

  const handleReset = () => {
    if (isDirty) {
      setShowResetDialog(true);
      return;
    }

    resetToProfile();
  };

  const handleDashboardReturn = () => {
    if (isDirty) {
      setShowLeaveDialog(true);
      return;
    }

    navigate(routePaths.adminDashboard);
  };

  const handleValidSubmit: SubmitHandler<AdminProfileFormValues> = async (formValues) => {
    if (!profile) {
      return;
    }

    const parsedValues: AdminProfileSubmitValues = adminProfileSchema.parse(formValues);
    const result = await saveAdminProfile({
      currentEmail: profile.email,
      currentPassword: parsedValues.currentPassword,
      displayName: parsedValues.displayName,
      email: parsedValues.email,
      ...(parsedValues.newPassword ? { newPassword: parsedValues.newPassword } : {})
    }, identity);

    if (!result.ok) {
      if (result.code === "INVALID_CURRENT_PASSWORD") {
        setError("currentPassword", {
          message: localized("वर्तमान पासवर्ड सही नहीं है।", "The current password is incorrect.")
        });
        window.setTimeout(() => setFocus("currentPassword"), 0);
        return;
      }

      setServerError(result.message);
      return;
    }

    setProfile(result.data.profile);
    reset(mapProfileToFormValues(result.data.profile));
    setServerError(null);
    setEmailChangePending(result.data.emailChangePending);
    setPasswordChanged(result.data.passwordChanged);
    setSaveSuccessDescription(result.data.saveMessage);
    setShowSaveSuccessDialog(true);
    await refreshSession();
  };

  const renderPasswordInput = (
    fieldName: PasswordFieldName,
    id: string,
    label: string,
    autoComplete: string,
    showPassword: boolean,
    onToggle: () => void,
    required = false
  ) => (
    <FormField
      error={errors[fieldName]?.message}
      id={id}
      label={label}
      required={required}
    >
      <div className="relative">
        <input
          aria-describedby={errors[fieldName] ? `${id}-error` : undefined}
          aria-invalid={Boolean(errors[fieldName])}
          autoComplete={autoComplete}
          className={cn(inputClasses, "pr-12")}
          id={id}
          type={showPassword ? "text" : "password"}
          {...register(fieldName)}
        />
        <button
          aria-label={showPassword
            ? localized("पासवर्ड छिपाएं", "Hide password")
            : localized("पासवर्ड दिखाएं", "Show password")}
          className="focus-ring absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-brown-700 transition-colors hover:bg-cream-100"
          onClick={onToggle}
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
  );

  if (loadState === "loading") {
    return (
      <div className="rounded-lg border border-maroon-700/10 bg-white p-6 shadow-subtle">
        <LoadingSpinner label={localized("प्रशासन प्रोफाइल लोड हो रही है…", "Admin profile is loading…")} />
      </div>
    );
  }

  if (loadState === "error" || !profile) {
    return (
      <ErrorState
        action={<PrimaryButton onClick={() => window.location.reload()}>{localized("पुनः लोड करें", "Reload")}</PrimaryButton>}
        description={serverError ?? localized("प्रशासन प्रोफाइल प्राप्त नहीं हो सकी।", "Admin profile could not be loaded.")}
        title={localized("प्रशासन प्रोफाइल लोड नहीं हुई", "Admin profile did not load")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description={localized(
          "प्रशासन लॉगिन के लिए उपयोग होने वाला नाम, ईमेल पता और पासवर्ड अपडेट करें।",
          "Update the name, email address and password used for admin login."
        )}
        eyebrow={localized("प्रशासन खाता सुरक्षा", "Admin account security")}
        title={localized("प्रशासन प्रोफाइल", "Admin Profile")}
      />

      <DevelopmentNotice
        message={
          isLocalDevProfile
            ? localized(
                "स्थानीय विकास मोड सक्रिय है। यहां किए गए बदलाव इस चल रहे Vite सर्वर सत्र में लागू होंगे; स्थायी बदलाव के लिए .env.local भी अपडेट करें।",
                "Local development mode is active. Changes here apply to this running Vite server session; update .env.local as well for permanent changes."
              )
            : localized(
                "Supabase Auth सक्रिय है। यह पृष्ठ मौजूदा अधिकृत प्रशासन खाते का नाम, ईमेल और पासवर्ड अपडेट करता है; प्रशासन भूमिका केवल trusted backend से सेट होनी चाहिए।",
                "Supabase Auth is active. This page updates the current authorized admin account name, email and password; the admin role must only be set from a trusted backend."
              )
        }
      />

      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start"
        noValidate
        onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
      >
        <div className="flex min-w-0 flex-col gap-6">
          {hasErrors ? (
            <div
              className="rounded-lg border border-maroon-700/25 bg-maroon-50 px-4 py-3 text-sm font-semibold leading-7 text-maroon-900"
              role="alert"
            >
              {localized("कृपया चिह्नित फील्ड जांचें।", "Please check the highlighted fields.")}
            </div>
          ) : null}

          {serverError ? (
            <div
              className="rounded-lg border border-maroon-700/25 bg-maroon-50 px-4 py-3 text-sm font-semibold leading-7 text-maroon-900"
              role="alert"
            >
              {serverError}
            </div>
          ) : null}

          <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-maroon-700 text-white">
                <UserCog aria-hidden="true" className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-maroon-900">
                  {localized("लॉगिन विवरण", "Login details")}
                </h2>
                <p className="text-sm leading-6 text-brown-700">
                  {getModeLabel(profile.authenticationMode, language === "en")}
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                error={errors.displayName?.message}
                id="admin-display-name"
                label={localized("प्रशासन नाम", "Admin name")}
                required
              >
                <input
                  aria-describedby={errors.displayName ? "admin-display-name-error" : undefined}
                  aria-invalid={Boolean(errors.displayName)}
                  autoComplete="name"
                  className={inputClasses}
                  id="admin-display-name"
                  type="text"
                  {...register("displayName")}
                />
              </FormField>

              <FormField
                error={errors.email?.message}
                id="admin-profile-email"
                label={localized("ईमेल पता", "Email address")}
                required
              >
                <input
                  aria-describedby={errors.email ? "admin-profile-email-error" : undefined}
                  aria-invalid={Boolean(errors.email)}
                  autoComplete="email"
                  className={inputClasses}
                  id="admin-profile-email"
                  type="email"
                  {...register("email")}
                />
              </FormField>
            </div>

            <div className="mt-5 max-w-md">
              {renderPasswordInput(
                "currentPassword",
                "admin-current-password",
                localized("वर्तमान पासवर्ड", "Current password"),
                "current-password",
                showCurrentPassword,
                () => setShowCurrentPassword((current) => !current),
                true
              )}
            </div>
          </section>

          <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-communityGreen-700 text-white">
                <KeyRound aria-hidden="true" className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-maroon-900">
                {localized("पासवर्ड बदलें", "Change password")}
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {renderPasswordInput(
                "newPassword",
                "admin-new-password",
                localized("नया पासवर्ड", "New password"),
                "new-password",
                showNewPassword,
                () => setShowNewPassword((current) => !current)
              )}

              {renderPasswordInput(
                "confirmNewPassword",
                "admin-confirm-new-password",
                localized("नया पासवर्ड पुष्टि", "Confirm new password"),
                "new-password",
                showConfirmNewPassword,
                () => setShowConfirmNewPassword((current) => !current)
              )}
            </div>

            <p className="mt-4 text-sm leading-7 text-brown-700">
              {localized(
                "पासवर्ड नहीं बदलना है तो नया पासवर्ड और पुष्टि फील्ड खाली छोड़ें।",
                "Leave the new password and confirmation fields blank to keep the current password."
              )}
            </p>
          </section>

          <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row">
                <OutlineButton onClick={handleDashboardReturn}>
                  <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                  {localized("डैशबोर्ड पर वापस जाएं", "Back to dashboard")}
                </OutlineButton>
                <SecondaryButton onClick={handleReset}>
                  <RotateCcw aria-hidden="true" className="h-5 w-5" />
                  {localized("परिवर्तन रीसेट करें", "Reset changes")}
                </SecondaryButton>
              </div>
              <PrimaryButton disabled={isSubmitting} type="submit">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                {isSubmitting
                  ? localized("प्रोफाइल सहेजी जा रही है…", "Saving profile…")
                  : localized("प्रोफाइल सुरक्षित रूप से सहेजें", "Save profile securely")}
              </PrimaryButton>
            </div>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle">
            <h2 className="text-lg font-bold text-maroon-900">
              {localized("वर्तमान प्रशासन खाता", "Current admin account")}
            </h2>
            <dl className="mt-4 space-y-4 text-sm leading-7">
              <div>
                <dt className="font-semibold text-brown-700">
                  {localized("नाम", "Name")}
                </dt>
                <dd className="break-words font-bold text-maroon-900">
                  {profile.displayName || localized("नाम सेट नहीं है", "No name set")}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-brown-700">
                  {localized("ईमेल", "Email")}
                </dt>
                <dd className="break-words font-bold text-maroon-900">{profile.email}</dd>
              </div>
              <div>
                <dt className="font-semibold text-brown-700">
                  {localized("लॉगिन मोड", "Login mode")}
                </dt>
                <dd className="font-bold text-maroon-900">
                  {getModeLabel(profile.authenticationMode, language === "en")}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-communityGreen-600/20 bg-communityGreen-50 p-5 shadow-subtle">
            <h2 className="flex items-center gap-2 text-lg font-bold text-communityGreen-800">
              <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
              {localized("सुरक्षा स्थिति", "Security status")}
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-brown-800">
              <li>{localized("सहेजने से पहले वर्तमान पासवर्ड जांचा जाएगा।", "The current password is checked before saving.")}</li>
              <li>{localized("प्रशासन भूमिका इस पृष्ठ से नहीं बदली जाती।", "The admin role is not changed from this page.")}</li>
              <li>{localized("नया पासवर्ड कम से कम 10 अक्षरों का होना चाहिए।", "The new password must be at least 10 characters.")}</li>
            </ul>
          </section>
        </aside>
      </form>

      <ConfirmDialog
        cancelLabel={localized("रद्द करें", "Cancel")}
        confirmLabel={localized("रीसेट करें", "Reset")}
        description={localized(
          "प्रशासन प्रोफाइल फॉर्म में किए गए बदलाव हट जाएंगे।",
          "Changes made in the admin profile form will be discarded."
        )}
        isOpen={showResetDialog}
        onCancel={() => setShowResetDialog(false)}
        onConfirm={resetToProfile}
        title={localized("प्रोफाइल परिवर्तन रीसेट करें?", "Reset profile changes?")}
      />

      <ConfirmDialog
        cancelLabel={localized("यहीं रहें", "Stay here")}
        confirmLabel={localized("पृष्ठ छोड़ें", "Leave page")}
        description={localized(
          "इस पृष्ठ से बाहर जाने पर भरी गई प्रोफाइल जानकारी हट सकती है। क्या आप जारी रखना चाहते हैं?",
          "Leaving this page may discard the entered profile information. Do you want to continue?"
        )}
        isOpen={showLeaveDialog}
        onCancel={() => setShowLeaveDialog(false)}
        onConfirm={() => navigate(routePaths.adminDashboard)}
        title={localized("प्रोफाइल परिवर्तन छोड़ें?", "Discard profile changes?")}
      />

      <ConfirmDialog
        confirmLabel={localized("ठीक है", "OK")}
        description={saveSuccessDescription}
        isOpen={showSaveSuccessDialog}
        onCancel={() => setShowSaveSuccessDialog(false)}
        onConfirm={() => setShowSaveSuccessDialog(false)}
        showCancel={false}
        title={localized("प्रशासन प्रोफाइल सहेजी गई", "Admin profile saved")}
      >
        {showSaveSuccessDetails ? (
          <ul className="list-disc space-y-2 pl-5">
            {emailChangePending ? (
              <li>{localized("नया ईमेल सक्रिय करने के लिए पुष्टिकरण लिंक जांचें।", "Check the confirmation link to activate the new email.")}</li>
            ) : null}
            {passwordChanged ? (
              <li>{localized("अगले लॉगिन में नया पासवर्ड उपयोग करें।", "Use the new password on the next login.")}</li>
            ) : null}
            {isLocalDevProfile ? (
              <li>{localized("Vite सर्वर restart होने पर .env.local की credentials फिर लागू होंगी।", "When the Vite server restarts, the .env.local credentials will apply again.")}</li>
            ) : null}
          </ul>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
