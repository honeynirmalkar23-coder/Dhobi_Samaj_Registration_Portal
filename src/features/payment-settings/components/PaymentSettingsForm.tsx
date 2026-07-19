import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, RotateCcw, ShieldCheck } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import type { FieldErrors, Resolver, SubmitErrorHandler, SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { OutlineButton, PrimaryButton, SecondaryButton } from "../../../components/common/Button";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { ErrorState } from "../../../components/common/ErrorState";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";
import { useQrCodePreview } from "../../../hooks/useQrCodePreview";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import {
  loadAdminPaymentSettings,
  saveAdminPaymentSettings
} from "../../../services/payment-settings.service";
import type { AdminPaymentSettings } from "../../../services/payment-settings.service";
import { paymentSettingsSchema } from "../schemas/payment-settings.schema";
import type { PaymentSettingsFormValues } from "../types/payment-settings.types";
import { mapPaymentSettingsFormToInput } from "../utilities/payment-settings.mapper";
import {
  paymentSettingsDefaults,
  paymentSettingsFieldIds,
  paymentSettingsFieldOrder
} from "../utilities/payment-settings.utils";
import { FeeDetailsSection } from "./FeeDetailsSection";
import { PaymentAvailabilitySection } from "./PaymentAvailabilitySection";
import { PaymentConfigurationSummary } from "./PaymentConfigurationSummary";
import { PaymentDeadlineSection } from "./PaymentDeadlineSection";
import { PaymentInstructionsSection } from "./PaymentInstructionsSection";
import { PaymentSettingsChecklist } from "./PaymentSettingsChecklist";
import { PaymentSettingsErrorSummary } from "./PaymentSettingsErrorSummary";
import { PaymentSettingsPreview } from "./PaymentSettingsPreview";
import { PublicContactSection } from "./PublicContactSection";
import { QrCodeSettingsField } from "./QrCodeSettingsField";
import { UpiDetailsSection } from "./UpiDetailsSection";

function toDatetimeLocalValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function mapSettingsToFormValues(settings: AdminPaymentSettings): PaymentSettingsFormValues {
  return {
    paymentEnabled: Boolean(settings.paymentEnabled),
    qrCodeFile: null,
    existingQrCodePath: typeof settings.qrCodePath === "string" ? settings.qrCodePath : "",
    upiId: typeof settings.upiId === "string" ? settings.upiId : "",
    payeeName: typeof settings.payeeName === "string" ? settings.payeeName : "",
    registrationFee: typeof settings.amount === "number" && Number.isFinite(settings.amount) ? String(settings.amount) : "",
    paymentTitle: typeof settings.paymentTitle === "string" ? settings.paymentTitle : "",
    paymentInstructions: typeof settings.instructions === "string" ? settings.instructions : "",
    publicSupportContact: typeof settings.publicContact === "string" ? settings.publicContact : "",
    paymentDeadline: toDatetimeLocalValue(settings.paymentDeadline ?? null)
  };
}

export function PaymentSettingsForm() {
  const { localized } = useLanguage();
  const defaultSaveSuccessDescription = localized(
    "भुगतान सेटिंग्स सुरक्षित रूप से सहेजी गई हैं।",
    "Payment settings have been saved securely."
  );
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [showSaveSuccessDialog, setShowSaveSuccessDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const [serverError, setServerError] = useState<string | null>(null);
  const [currentQrCodePath, setCurrentQrCodePath] = useState<string | null>(null);
  const [existingQrCodeUrl, setExistingQrCodeUrl] = useState<string | null>(null);
  const [saveSuccessDescriptionText, setSaveSuccessDescriptionText] = useState(defaultSaveSuccessDescription);
  const [isLocalDataSource, setIsLocalDataSource] = useState(false);
  const methods = useForm<PaymentSettingsFormValues>({
    defaultValues: paymentSettingsDefaults,
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(paymentSettingsSchema) as unknown as Resolver<PaymentSettingsFormValues>,
    shouldFocusError: false
  });
  const {
    clearErrors,
    control,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    reset,
    setFocus
  } = methods;
  const watchedValues = useWatch({
    control,
    defaultValue: paymentSettingsDefaults
  }) as PaymentSettingsFormValues;
  const qrPreviewUrl = useQrCodePreview(watchedValues.qrCodeFile);
  const effectiveQrPreviewUrl = qrPreviewUrl ?? (watchedValues.existingQrCodePath ? existingQrCodeUrl : null);
  const hasErrors = Object.keys(errors).length > 0;

  useUnsavedChanges(isDirty);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      let result: Awaited<ReturnType<typeof loadAdminPaymentSettings>>;

      try {
        result = await loadAdminPaymentSettings();
      } catch {
        if (isMounted) {
          setServerError(localized("भुगतान सेटिंग्स प्राप्त नहीं हो सकीं।", "Payment settings could not be loaded."));
          setLoadState("error");
        }
        return;
      }

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setServerError(result.message);
        setLoadState("error");
        return;
      }

      setCurrentQrCodePath(result.data.qrCodePath ?? null);
      setExistingQrCodeUrl(result.data.qrCodeSignedUrl ?? null);
      setIsLocalDataSource(result.data.dataSource === "local-dev");
      reset(mapSettingsToFormValues(result.data));
      setLoadState("loaded");
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const focusFirstError = (submitErrors: FieldErrors<PaymentSettingsFormValues>) => {
    const firstErrorName = paymentSettingsFieldOrder.find((fieldName) => fieldName in submitErrors);

    if (!firstErrorName) {
      return;
    }

    if (firstErrorName === "qrCodeFile") {
      document.getElementById(paymentSettingsFieldIds.qrCodeFile)?.focus();
      return;
    }

    setFocus(firstErrorName);
  };

  const handleInvalidSubmit: SubmitErrorHandler<PaymentSettingsFormValues> = (submitErrors) => {
    window.setTimeout(() => focusFirstError(submitErrors), 0);
  };

  const handleValidSubmit: SubmitHandler<PaymentSettingsFormValues> = async (formValues) => {
    if (isChecking) {
      return;
    }

    const normalizedInput = mapPaymentSettingsFormToInput(formValues);

    setServerError(null);
    setIsChecking(true);
    let result: Awaited<ReturnType<typeof saveAdminPaymentSettings>>;

    try {
      result = await saveAdminPaymentSettings({
        input: normalizedInput,
        currentQrCodePath: formValues.existingQrCodePath || null,
        previousQrCodePath: currentQrCodePath
      });
    } catch {
      setIsChecking(false);
      setServerError(localized("भुगतान सेटिंग्स सहेजी नहीं जा सकीं।", "Payment settings could not be saved."));
      return;
    }

    setIsChecking(false);

    if (!result.ok) {
      setServerError(result.message);
      return;
    }

    setCurrentQrCodePath(result.data.qrCodePath ?? null);
    setExistingQrCodeUrl(result.data.qrCodeSignedUrl ?? null);
    setSaveSuccessDescriptionText(result.data.saveMessage ?? defaultSaveSuccessDescription);
    setIsLocalDataSource(result.data.dataSource === "local-dev");
    reset(mapSettingsToFormValues(result.data));
    setShowSaveSuccessDialog(true);
  };

  const focusFirstField = () => {
    window.setTimeout(() => setFocus("paymentEnabled"), 0);
  };

  const resetForm = () => {
    reset(paymentSettingsDefaults);
    clearErrors();
    setExistingQrCodeUrl(null);
    setCurrentQrCodePath(null);
    setShowResetDialog(false);
    focusFirstField();
  };

  const handleReset = () => {
    if (isDirty) {
      setShowResetDialog(true);
      return;
    }

    resetForm();
  };

  const handleDashboardReturn = () => {
    if (isDirty) {
      setShowLeaveDialog(true);
      return;
    }

    navigate(routePaths.adminDashboard);
  };

  if (loadState === "loading") {
    return (
      <div className="rounded-lg border border-maroon-700/10 bg-white p-6 shadow-subtle">
        <LoadingSpinner label={localized("भुगतान सेटिंग्स लोड हो रही हैं…", "Payment settings are loading…")} />
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <ErrorState
        action={<PrimaryButton onClick={() => window.location.reload()}>{localized("पुनः लोड करें", "Reload")}</PrimaryButton>}
        description={serverError ?? localized("भुगतान सेटिंग्स प्राप्त नहीं हो सकीं।", "Payment settings could not be loaded.")}
        title={localized("भुगतान सेटिंग्स लोड नहीं हुईं", "Payment settings did not load")}
      />
    );
  }

  return (
    <FormProvider {...methods}>
      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start"
        noValidate
        onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
      >
        <div className="flex min-w-0 flex-col gap-6">
          {hasErrors ? <PaymentSettingsErrorSummary errors={errors} /> : null}
          {serverError ? (
            <div
              className="rounded-lg border border-maroon-700/25 bg-maroon-50 px-4 py-3 text-sm font-semibold leading-7 text-maroon-900"
              role="alert"
            >
              {serverError}
            </div>
          ) : null}
          <PaymentAvailabilitySection />
          <QrCodeSettingsField existingQrCodeUrl={existingQrCodeUrl} previewUrl={qrPreviewUrl} />
          <UpiDetailsSection />
          <FeeDetailsSection />
          <PaymentInstructionsSection />
          <PublicContactSection />
          <PaymentDeadlineSection />

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
              <PrimaryButton disabled={isChecking || isSubmitting} type="submit">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                {isChecking
                  ? localized("सेटिंग्स सहेजी जा रही हैं…", "Saving settings…")
                  : localized("सेटिंग्स सुरक्षित रूप से सहेजें", "Save settings securely")}
              </PrimaryButton>
            </div>
            <p className="mt-4 text-sm leading-7 text-brown-700">
              {isLocalDataSource
                ? localized(
                    "सेटिंग्स स्थानीय परीक्षण डेटाबेस और निजी QR स्टोरेज में सहेजी जाएंगी।",
                    "Settings will be saved in the local test database and private QR storage."
                  )
                : localized(
                    "सेटिंग्स सुरक्षित डेटाबेस और निजी QR स्टोरेज में सहेजी जाएंगी।",
                    "Settings will be saved in the secure database and private QR storage."
                  )}
            </p>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <PaymentSettingsPreview qrPreviewUrl={effectiveQrPreviewUrl} values={watchedValues} />
          <PaymentConfigurationSummary values={watchedValues} />
          <PaymentSettingsChecklist values={watchedValues} />
        </aside>
      </form>

      <ConfirmDialog
        cancelLabel={localized("रद्द करें", "Cancel")}
        confirmLabel={localized("रीसेट करें", "Reset")}
        description={localized(
          "फॉर्म में भरी गई भुगतान जानकारी और चुना गया QR कोड हट जाएगा।",
          "The payment information entered in the form and selected QR code will be removed."
        )}
        isOpen={showResetDialog}
        onCancel={() => setShowResetDialog(false)}
        onConfirm={resetForm}
        title={localized("सभी परिवर्तन रीसेट करें?", "Reset all changes?")}
      />

      <ConfirmDialog
        cancelLabel={localized("यहीं रहें", "Stay here")}
        confirmLabel={localized("पृष्ठ छोड़ें", "Leave page")}
        description={localized(
          "इस पृष्ठ से बाहर जाने पर भरी गई जानकारी और चुना गया QR कोड हट सकता है। क्या आप जारी रखना चाहते हैं?",
          "Leaving this page may discard entered information and the selected QR code. Do you want to continue?"
        )}
        isOpen={showLeaveDialog}
        onCancel={() => setShowLeaveDialog(false)}
        onConfirm={() => navigate(routePaths.adminDashboard)}
        title={localized("भुगतान सेटिंग्स के परिवर्तन छोड़ें?", "Discard payment settings changes?")}
      />

      <ConfirmDialog
        confirmLabel={localized("ठीक है", "OK")}
        description={saveSuccessDescriptionText}
        isOpen={showSaveSuccessDialog}
        onCancel={() => setShowSaveSuccessDialog(false)}
        onConfirm={() => setShowSaveSuccessDialog(false)}
        showCancel={false}
        title={localized("भुगतान सेटिंग्स सहेजी गईं", "Payment settings saved")}
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>{localized("QR कोड निजी स्टोरेज में रखा गया है।", "The QR code is kept in private storage.")}</li>
          <li>
            {isLocalDataSource
              ? localized(
                  "सार्वजनिक भुगतान पृष्ठ स्थानीय परीक्षण backend से सक्रिय सेटिंग्स पढ़ेगा।",
                  "The public payment page will read active settings from the local test backend."
                )
              : localized(
                  "सार्वजनिक भुगतान पृष्ठ केवल सुरक्षित सार्वजनिक Edge Function से सेटिंग्स पढ़ेगा।",
                  "The public payment page will read settings only from the secure public Edge Function."
                )}
          </li>
          <li>{localized("सेटिंग्स अपडेट की प्रशासनिक ऑडिट एंट्री दर्ज होगी।", "An administrative audit entry will be recorded for the settings update.")}</li>
        </ul>
      </ConfirmDialog>
    </FormProvider>
  );
}
