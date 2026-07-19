import { useCallback, useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Clock, Download, Home, Search, ShieldCheck, XCircle } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import type { FieldErrors, Resolver, SubmitErrorHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { OutlineButton, PrimaryButton, SecondaryButton } from "../../../components/common/Button";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import {
  downloadAcknowledgementPdf,
  submitPaymentProof
} from "../../../services/payment.service";
import type { SubmitPaymentProofResult } from "../../../services/payment.service";
import { paymentProofSchema } from "../schemas/payment-proof.schema";
import type { PaymentProofFormInputValues, PublicPaymentSettings } from "../types/payment.types";
import { paymentProofDefaults, paymentProofFieldIds } from "../utilities/payment-file.utils";
import { PaymentDeclarationSection } from "./PaymentDeclarationSection";
import { PaymentFormErrorSummary } from "./PaymentFormErrorSummary";
import { PaymentProofField } from "./PaymentProofField";
import { PaymentSummaryCard } from "./PaymentSummaryCard";

type PaymentProofFormProps = {
  registrationId: string;
  settings: PublicPaymentSettings;
  paymentAccessToken: string;
  paymentResubmissionAllowed?: boolean;
};

type PaymentSubmissionState =
  | "idle"
  | "validating"
  | "submitting-proof"
  | "proof-submitted"
  | "downloading-acknowledgement"
  | "download-initiated"
  | "redirect-pending"
  | "completed"
  | "error";

const paymentProofFieldOrder: (keyof PaymentProofFormInputValues)[] = [
  "paymentScreenshot",
  "declarationAccepted"
];

type StoredSubmissionResult = Pick<
  SubmitPaymentProofResult,
  "acknowledgementAvailable" | "paymentStatus" | "registrationId" | "registrationStatus" | "submittedAt"
>;
type PaymentSubmissionResultState = StoredSubmissionResult & Pick<
  SubmitPaymentProofResult,
  "acknowledgementDownloadUrl" | "acknowledgementNumber"
>;

const redirectSeconds = 5;

function getSubmissionStorageKey(registrationId: string): string {
  return `dhobi-payment-submission:${registrationId}`;
}

function isPaymentReady(settings: PublicPaymentSettings): boolean {
  return Boolean(settings.paymentEnabled && settings.qrCodeUrl && settings.upiId);
}

function isTerminalSubmittedState(state: PaymentSubmissionState): boolean {
  return [
    "proof-submitted",
    "downloading-acknowledgement",
    "download-initiated",
    "redirect-pending",
    "completed"
  ].includes(state);
}

function canStartSubmission(state: PaymentSubmissionState): boolean {
  return state === "idle" || state === "error";
}

function loadStoredSubmission(registrationId: string): StoredSubmissionResult | null {
  try {
    const rawValue = sessionStorage.getItem(getSubmissionStorageKey(registrationId));

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<StoredSubmissionResult>;

    if (
      parsedValue.registrationId === registrationId &&
      parsedValue.registrationStatus === "submitted" &&
      parsedValue.paymentStatus === "pending_verification" &&
      typeof parsedValue.submittedAt === "string"
    ) {
      return {
        acknowledgementAvailable: Boolean(parsedValue.acknowledgementAvailable),
        paymentStatus: "pending_verification",
        registrationId,
        registrationStatus: "submitted",
        submittedAt: parsedValue.submittedAt
      };
    }
  } catch {
    return null;
  }

  return null;
}

function storeSubmissionResult(result: StoredSubmissionResult): void {
  sessionStorage.setItem(getSubmissionStorageKey(result.registrationId), JSON.stringify({
    acknowledgementAvailable: Boolean(result.acknowledgementAvailable),
    paymentStatus: result.paymentStatus,
    registrationId: result.registrationId,
    registrationStatus: result.registrationStatus,
    submittedAt: result.submittedAt
  }));
}

function clearStoredSubmission(registrationId: string): void {
  sessionStorage.removeItem(getSubmissionStorageKey(registrationId));
}

function formatSubmissionTime(value: string | undefined, language: "hi" | "en" = "hi"): string {
  if (!value) {
    return language === "en" ? "Unavailable" : "उपलब्ध नहीं";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return language === "en" ? "Unavailable" : "उपलब्ध नहीं";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-IN" : "hi-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function PaymentProofForm({
  paymentAccessToken,
  paymentResubmissionAllowed = false,
  registrationId,
  settings
}: PaymentProofFormProps) {
  const { language, localized } = useLanguage();
  const navigate = useNavigate();
  const pendingVerificationMessage = localized(
    "भुगतान प्रमाण सफलतापूर्वक जमा हो गया है। प्रशासनिक सत्यापन लंबित है।",
    "Payment proof has been submitted successfully. Administrative verification is pending."
  );
  const pdfFailureMessage = localized(
    "भुगतान प्रमाण जमा हो गया है, लेकिन पावती स्वतः डाउनलोड नहीं हो सकी।",
    "Payment proof has been submitted, but the acknowledgement could not be downloaded automatically."
  );
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<PaymentSubmissionResultState | null>(() => loadStoredSubmission(registrationId));
  const [submissionState, setSubmissionState] = useState<PaymentSubmissionState>(() =>
    loadStoredSubmission(registrationId) ? "proof-submitted" : "idle"
  );
  const [redirectCountdown, setRedirectCountdown] = useState(redirectSeconds);
  const redirectTimeoutRef = useRef<number | null>(null);
  const redirectIntervalRef = useRef<number | null>(null);
  const objectUrlCleanupRef = useRef<number | null>(null);
  const methods = useForm<PaymentProofFormInputValues>({
    defaultValues: paymentProofDefaults,
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(paymentProofSchema) as unknown as Resolver<PaymentProofFormInputValues>,
    shouldFocusError: false
  });
  const {
    control,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    setFocus
  } = methods;
  const watchedValues = useWatch({
    control,
    defaultValue: paymentProofDefaults
  }) as PaymentProofFormInputValues;
  const hasErrors = Object.keys(errors).length > 0;
  const paymentReady = isPaymentReady(settings);
  const hasSubmittedProof = isTerminalSubmittedState(submissionState);
  const isWorkflowRunning = !canStartSubmission(submissionState);
  const canSubmit = canStartSubmission(submissionState) &&
    Boolean(watchedValues.paymentScreenshot) &&
    watchedValues.declarationAccepted &&
    Boolean(paymentAccessToken) &&
    paymentReady &&
    !hasErrors;
  const submitLabel = submissionState === "submitting-proof"
    ? localized("भुगतान प्रमाण जमा किया जा रहा है…", "Submitting payment proof…")
    : submissionState === "downloading-acknowledgement"
      ? localized("पावती तैयार की जा रही है…", "Preparing acknowledgement…")
      : hasSubmittedProof
        ? localized("भुगतान प्रमाण जमा हो गया", "Payment proof submitted")
        : localized("भुगतान प्रमाण जमा करें", "Submit payment proof");

  useUnsavedChanges(isDirty && !hasSubmittedProof);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
      if (redirectIntervalRef.current !== null) {
        window.clearInterval(redirectIntervalRef.current);
      }
      if (objectUrlCleanupRef.current !== null) {
        window.clearTimeout(objectUrlCleanupRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!paymentResubmissionAllowed) {
      return;
    }

    clearStoredSubmission(registrationId);
    setSubmissionResult(null);
    setDownloadError(null);
    setSubmissionState((currentState) =>
      isTerminalSubmittedState(currentState) ? "idle" : currentState
    );
  }, [paymentResubmissionAllowed, registrationId]);

  const clearRedirectTimers = useCallback(() => {
    if (redirectTimeoutRef.current !== null) {
      window.clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    if (redirectIntervalRef.current !== null) {
      window.clearInterval(redirectIntervalRef.current);
      redirectIntervalRef.current = null;
    }
  }, []);

  const scheduleHomeRedirect = useCallback(() => {
    clearRedirectTimers();
    setRedirectCountdown(redirectSeconds);
    setSubmissionState("redirect-pending");

    redirectIntervalRef.current = window.setInterval(() => {
      setRedirectCountdown((currentValue) => Math.max(0, currentValue - 1));
    }, 1000);

    redirectTimeoutRef.current = window.setTimeout(() => {
      clearRedirectTimers();
      setSubmissionState("completed");
      navigate(routePaths.home, {
        replace: true
      });
    }, redirectSeconds * 1000);
  }, [clearRedirectTimers, navigate]);

  const cancelHomeRedirect = useCallback(() => {
    clearRedirectTimers();
    setSubmissionState("download-initiated");
  }, [clearRedirectTimers]);

  const downloadAcknowledgement = useCallback(async (downloadUrl: string): Promise<boolean> => {
    setDownloadError(null);
    setSubmissionState("downloading-acknowledgement");

    const result = await downloadAcknowledgementPdf({
      downloadUrl,
      paymentAccessToken,
      registrationId
    });

    if (!result.ok) {
      setDownloadError(pdfFailureMessage);
      setSubmissionState("proof-submitted");
      return false;
    }

    const objectUrl = URL.createObjectURL(result.data.blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = result.data.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();

    if (objectUrlCleanupRef.current !== null) {
      window.clearTimeout(objectUrlCleanupRef.current);
    }
    objectUrlCleanupRef.current = window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      objectUrlCleanupRef.current = null;
    }, 1000);

    setSubmissionState("download-initiated");
    return true;
  }, [paymentAccessToken, pdfFailureMessage, registrationId]);

  const focusFirstError = (submitErrors: FieldErrors<PaymentProofFormInputValues>) => {
    const firstErrorName = paymentProofFieldOrder.find((fieldName) => fieldName in submitErrors);

    if (!firstErrorName) {
      return;
    }

    if (firstErrorName === "paymentScreenshot") {
      document.getElementById(paymentProofFieldIds.paymentScreenshot)?.focus();
      return;
    }

    setFocus(firstErrorName);
  };

  const handleInvalidSubmit: SubmitErrorHandler<PaymentProofFormInputValues> = (submitErrors) => {
    window.setTimeout(() => focusFirstError(submitErrors), 0);
  };

  const handleValidSubmit = async (values: PaymentProofFormInputValues) => {
    if (!canStartSubmission(submissionState)) {
      return;
    }

    setServerError(null);
    setDownloadError(null);
    setSubmissionState("validating");

    if (!paymentAccessToken) {
      setServerError(localized(
        "भुगतान प्रमाण अनुमति उपलब्ध नहीं है। कृपया पंजीकरण प्रक्रिया दोबारा शुरू करें।",
        "Payment proof permission is unavailable. Please start the registration process again."
      ));
      setSubmissionState("error");
      return;
    }

    if (!paymentReady) {
      setServerError(localized(
        "भुगतान सेटिंग्स उपलब्ध नहीं हैं। कृपया बाद में प्रयास करें।",
        "Payment settings are unavailable. Please try again later."
      ));
      setSubmissionState("error");
      return;
    }

    setSubmissionState("submitting-proof");
    const result = await submitPaymentProof({
      paymentAccessToken,
      registrationId,
      values
    });

    if (!result.ok) {
      setServerError(result.message);
      setSubmissionState("error");
      return;
    }

    if (
      result.data.registrationId !== registrationId ||
      result.data.registrationStatus !== "submitted" ||
      result.data.paymentStatus !== "pending_verification"
    ) {
      setServerError(localized(
        "भुगतान प्रमाण प्रतिक्रिया मान्य नहीं है। कृपया स्थिति पृष्ठ देखें।",
        "The payment-proof response is not valid. Please check the status page."
      ));
      setSubmissionState("error");
      return;
    }

    const storedResult: PaymentSubmissionResultState = {
      acknowledgementAvailable: result.data.acknowledgementAvailable ?? Boolean(result.data.acknowledgementDownloadUrl),
      ...(typeof result.data.acknowledgementDownloadUrl === "string"
        ? { acknowledgementDownloadUrl: result.data.acknowledgementDownloadUrl }
        : {}),
      ...(typeof result.data.acknowledgementNumber === "string"
        ? { acknowledgementNumber: result.data.acknowledgementNumber }
        : {}),
      paymentStatus: result.data.paymentStatus,
      registrationId: result.data.registrationId,
      registrationStatus: result.data.registrationStatus,
      submittedAt: result.data.submittedAt
    };

    setSubmissionResult(storedResult);
    storeSubmissionResult(storedResult);
    setSubmissionState("proof-submitted");

    if (!storedResult.acknowledgementAvailable || !storedResult.acknowledgementDownloadUrl) {
      setDownloadError(pdfFailureMessage);
      return;
    }

    const downloadStarted = await downloadAcknowledgement(storedResult.acknowledgementDownloadUrl);

    if (downloadStarted) {
      scheduleHomeRedirect();
    }
  };

  const handleBack = () => {
    if (isDirty) {
      setShowLeaveDialog(true);
      return;
    }

    navigate(routePaths.status);
  };

  const handleManualDownload = async () => {
    if (!submissionResult?.acknowledgementDownloadUrl) {
      setDownloadError(pdfFailureMessage);
      return;
    }

    const downloadStarted = await downloadAcknowledgement(submissionResult.acknowledgementDownloadUrl);

    if (downloadStarted) {
      scheduleHomeRedirect();
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
        noValidate
        onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
      >
        <div className="flex min-w-0 flex-col gap-6">
          {hasErrors ? <PaymentFormErrorSummary errors={errors} /> : null}
          <PaymentProofField />
          <PaymentDeclarationSection />

          {serverError ? (
            <div
              className="rounded-lg border border-maroon-700/25 bg-maroon-50 px-4 py-3 text-sm font-semibold leading-7 text-maroon-900"
              role="alert"
            >
              {serverError}
            </div>
          ) : null}

          {paymentResubmissionAllowed && !hasSubmittedProof ? (
            <div
              className="rounded-lg border border-saffron-500/30 bg-saffron-50 px-4 py-3 text-sm font-semibold leading-7 text-brown-800"
              role="status"
            >
              {localized(
                "पिछले भुगतान प्रमाण की पुनः जमा अनुमति उपलब्ध है। कृपया नया स्क्रीनशॉट चुनकर प्रमाण दोबारा जमा करें।",
                "Resubmission is available for the previous payment proof. Please choose a new screenshot and submit proof again."
              )}
            </div>
          ) : null}

          {hasSubmittedProof ? (
            <section
              className="rounded-lg border border-communityGreen-600/25 bg-communityGreen-50 p-5 shadow-subtle sm:p-6"
              role="status"
            >
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-communityGreen-700">
                  {localized("पावती जमा", "Acknowledgement submitted")}
                </p>
                <h2 className="text-2xl font-bold text-maroon-900">
                  {localized("भुगतान प्रमाण जमा हो गया", "Payment proof submitted")}
                </h2>
                <p className="text-sm font-semibold leading-7 text-communityGreen-700">
                  {pendingVerificationMessage}
                </p>
              </div>
              <dl className="mt-5 grid gap-3 text-sm leading-7 sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-brown-700">{localized("पंजीकरण आईडी", "Registration ID")}</dt>
                  <dd className="break-words font-bold text-maroon-900">{registrationId}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-brown-700">{localized("पंजीकरण स्थिति", "Registration status")}</dt>
                  <dd className="font-bold text-maroon-900">{localized("जमा किया गया", "Submitted")}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-brown-700">{localized("भुगतान स्थिति", "Payment status")}</dt>
                  <dd className="font-bold text-maroon-900">{localized("सत्यापन लंबित", "Pending verification")}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-brown-700">{localized("जमा करने का समय", "Submission time")}</dt>
                  <dd className="font-bold text-maroon-900">{formatSubmissionTime(submissionResult?.submittedAt, language)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-brown-700">{localized("पावती डाउनलोड", "Acknowledgement download")}</dt>
                  <dd className="font-bold text-maroon-900">
                    {submissionState === "redirect-pending" || submissionState === "download-initiated" || submissionState === "completed"
                      ? localized("डाउनलोड शुरू हुआ", "Download started")
                      : downloadError
                        ? localized("दोबारा प्रयास करें", "Try again")
                        : localized("तैयार की जा रही है", "Preparing")}
                  </dd>
                </div>
                {submissionResult?.acknowledgementNumber ? (
                  <div>
                    <dt className="font-semibold text-brown-700">{localized("पावती संख्या", "Acknowledgement number")}</dt>
                    <dd className="break-words font-bold text-maroon-900">{submissionResult.acknowledgementNumber}</dd>
                  </div>
                ) : null}
              </dl>
              <p className="mt-4 rounded-lg border border-saffron-500/30 bg-saffron-50 px-4 py-3 text-sm font-semibold leading-7 text-brown-800">
                {localized(
                  "यह अंतिम भुगतान रसीद नहीं है। भुगतान सत्यापन प्रशासन द्वारा किया जाएगा।",
                  "This is not a final payment receipt. Payment verification will be completed by administration."
                )}
              </p>
              {submissionState === "redirect-pending" ? (
                <p className="mt-4 flex gap-2 text-sm font-semibold leading-7 text-communityGreen-700">
                  <Clock aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" />
                  {localized(
                    `${redirectCountdown} सेकंड में होम पेज पर भेजा जाएगा।`,
                    `You will be sent to the home page in ${redirectCountdown} seconds.`
                  )}
                </p>
              ) : null}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <SecondaryButton
                  disabled={!submissionResult?.acknowledgementDownloadUrl || submissionState === "downloading-acknowledgement"}
                  onClick={handleManualDownload}
                >
                  <Download aria-hidden="true" className="h-5 w-5" />
                  {downloadError
                    ? localized("पावती डाउनलोड करें", "Download acknowledgement")
                    : localized("पावती दोबारा डाउनलोड करें", "Download acknowledgement again")}
                </SecondaryButton>
                <PrimaryButton to={`${routePaths.status}?registrationId=${encodeURIComponent(registrationId)}`}>
                  <Search aria-hidden="true" className="h-5 w-5" />
                  {localized("स्थिति देखें", "View status")}
                </PrimaryButton>
                <OutlineButton to={routePaths.home}>
                  <Home aria-hidden="true" className="h-5 w-5" />
                  {localized("होम पेज पर जाएं", "Go to home page")}
                </OutlineButton>
                {submissionState === "redirect-pending" ? (
                  <OutlineButton onClick={cancelHomeRedirect}>
                    <XCircle aria-hidden="true" className="h-5 w-5" />
                    {localized("इस पेज पर रहें", "Stay on this page")}
                  </OutlineButton>
                ) : null}
              </div>
            </section>
          ) : null}

          {downloadError ? (
            <div
              className="rounded-lg border border-saffron-500/30 bg-saffron-50 px-4 py-3 text-sm font-semibold leading-7 text-brown-800"
              role="alert"
            >
              {downloadError}
            </div>
          ) : null}

          <div className="lg:hidden">
            <PaymentSummaryCard
              registrationId={registrationId}
              settings={settings}
              values={watchedValues}
            />
          </div>

          <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <OutlineButton onClick={handleBack}>
                <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                {localized("वापस जाएं", "Go back")}
              </OutlineButton>
              <PrimaryButton disabled={!canSubmit || isSubmitting || isWorkflowRunning} type="submit">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                {submitLabel}
              </PrimaryButton>
            </div>
            <p className="mt-4 text-sm leading-7 text-brown-700">
              {localized(
                "भुगतान प्रमाण जमा होने के बाद स्थिति सत्यापन लंबित के रूप में अपडेट होगी।",
                "After payment proof is submitted, the status will be updated as pending verification."
              )}
            </p>
          </section>
        </div>

        <div className="hidden lg:block">
          <PaymentSummaryCard
            registrationId={registrationId}
            settings={settings}
            values={watchedValues}
          />
        </div>
      </form>

      <ConfirmDialog
        cancelLabel={localized("यहीं रहें", "Stay here")}
        confirmLabel={localized("पृष्ठ छोड़ें", "Leave page")}
        description={localized(
          "इस पृष्ठ से बाहर जाने पर अभी तक चुना गया भुगतान प्रमाण हट सकता है। क्या आप जारी रखना चाहते हैं?",
          "Leaving this page may remove the payment proof selected so far. Do you want to continue?"
        )}
        isOpen={showLeaveDialog}
        onCancel={() => setShowLeaveDialog(false)}
        onConfirm={() => navigate(routePaths.status)}
        title={localized("भुगतान प्रमाण छोड़ें?", "Discard payment proof?")}
      />

    </FormProvider>
  );
}
