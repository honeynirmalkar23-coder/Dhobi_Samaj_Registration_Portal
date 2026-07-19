import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import type { Resolver, SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { OutlineButton, PrimaryButton } from "../../../components/common/Button";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { routeBuilders, routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { createRegistration } from "../../../services/registration.service";
import { storePaymentAccessToken } from "../../../services/payment.service";
import { registrationFormSchema } from "../schemas/registration-form.schema";
import type { RegistrationFormInputValues } from "../types/registration-form.types";
import {
  registrationFieldIds,
  registrationFormDefaults
} from "../utilities/registration-form.utils";
import { AddressSection } from "./AddressSection";
import { ApplicantPhotoField } from "./ApplicantPhotoField";
import { DeclarationSection } from "./DeclarationSection";
import { EducationDetailsSection } from "./EducationDetailsSection";
import { FamilyDetailsSection } from "./FamilyDetailsSection";
import { FormErrorSummary } from "./FormErrorSummary";
import { PersonalDetailsSection } from "./PersonalDetailsSection";
import { RegistrationSummaryCard } from "./RegistrationSummaryCard";

export function RegistrationForm() {
  const { localized } = useLanguage();
  const navigate = useNavigate();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hasSubmittedRef = useRef(false);
  const methods = useForm<RegistrationFormInputValues>({
    defaultValues: registrationFormDefaults,
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(registrationFormSchema) as unknown as Resolver<RegistrationFormInputValues>,
    shouldFocusError: true
  });
  const {
    control,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    reset,
    setFocus
  } = methods;
  const watchedValues = useWatch({
    control,
    defaultValue: registrationFormDefaults
  }) as RegistrationFormInputValues;
  const hasErrors = Object.keys(errors).length > 0;

  useUnsavedChanges(isDirty && !hasSubmittedRef.current);

  const focusFirstError = () => {
    const firstErrorName = Object.keys(errors)[0] as keyof RegistrationFormInputValues | undefined;

    if (!firstErrorName) {
      return;
    }

    if (firstErrorName === "applicantPhoto") {
      document.getElementById(registrationFieldIds.applicantPhoto)?.focus();
      return;
    }

    setFocus(firstErrorName);
  };

  const handleInvalidSubmit = () => {
    window.setTimeout(focusFirstError, 0);
  };

  const handleValidSubmit: SubmitHandler<RegistrationFormInputValues> = async (values) => {
    if (isSubmittingRegistration) {
      return;
    }

    setServerError(null);
    setSuccessMessage(null);
    setIsSubmittingRegistration(true);

    const result = await createRegistration(values);

    setIsSubmittingRegistration(false);

    if (!result.ok) {
      setServerError(result.message);
      return;
    }

    hasSubmittedRef.current = true;
    storePaymentAccessToken(result.data.registrationId, result.data.paymentAccessToken);
    setSuccessMessage(localized(
      "पंजीकरण बनाया गया है। भुगतान प्रमाण जमा करने के लिए आगे बढ़ें।",
      "Registration has been created. Continue to submit payment proof."
    ));
    reset(registrationFormDefaults);
    navigate(routeBuilders.paymentDetail(result.data.registrationId));
  };

  const handleBack = () => {
    if (isDirty) {
      setShowLeaveDialog(true);
      return;
    }

    navigate(routePaths.home);
  };

  return (
    <FormProvider {...methods}>
      <form
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
        noValidate
        onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
      >
        <div className="flex min-w-0 flex-col gap-6">
          {hasErrors ? <FormErrorSummary errors={errors} /> : null}
          <PersonalDetailsSection />
          <EducationDetailsSection />
          <AddressSection />
          <FamilyDetailsSection />
          <ApplicantPhotoField />
          <DeclarationSection />

          {serverError ? (
            <div
              className="rounded-lg border border-maroon-700/25 bg-maroon-50 px-4 py-3 text-sm font-semibold leading-7 text-maroon-900"
              role="alert"
            >
              {serverError}
            </div>
          ) : null}

          {successMessage ? (
            <div
              className="rounded-lg border border-communityGreen-600/25 bg-communityGreen-50 px-4 py-3 text-sm font-semibold leading-7 text-communityGreen-700"
              role="status"
            >
              {successMessage}
            </div>
          ) : null}

          <div className="lg:hidden">
            <RegistrationSummaryCard values={watchedValues} />
          </div>

          <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <OutlineButton onClick={handleBack}>
                <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                {localized("वापस जाएं", "Go back")}
              </OutlineButton>
              <PrimaryButton disabled={isSubmittingRegistration || isSubmitting} type="submit">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                {isSubmittingRegistration
                  ? localized("पंजीकरण बनाया जा रहा है…", "Creating registration…")
                  : localized("सहेजें और भुगतान पर जाएं", "Save and go to payment")}
              </PrimaryButton>
            </div>
            <p className="mt-4 text-sm leading-7 text-brown-700">
              {localized(
                "पंजीकरण बनने के बाद भुगतान प्रमाण जमा करने के लिए सुरक्षित भुगतान पृष्ठ खुलेगा।",
                "After the registration is created, the secure payment page will open for payment-proof submission."
              )}
            </p>
          </section>
        </div>

        <div className="hidden lg:block">
          <RegistrationSummaryCard values={watchedValues} />
        </div>
      </form>

      <ConfirmDialog
        cancelLabel={localized("यहीं रहें", "Stay here")}
        confirmLabel={localized("पृष्ठ छोड़ें", "Leave page")}
        description={localized(
          "इस पृष्ठ से बाहर जाने पर अभी तक भरी गई जानकारी हट सकती है। क्या आप जारी रखना चाहते हैं?",
          "Leaving this page may discard the information entered so far. Do you want to continue?"
        )}
        isOpen={showLeaveDialog}
        onCancel={() => setShowLeaveDialog(false)}
        onConfirm={() => navigate(routePaths.home)}
        title={localized("भरी गई जानकारी छोड़ें?", "Discard entered information?")}
      />

    </FormProvider>
  );
}
