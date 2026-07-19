import { useParams } from "react-router-dom";
import { ErrorState } from "../../components/common/ErrorState";
import { OutlineButton, PrimaryButton } from "../../components/common/Button";
import { routePaths } from "../../config/routes.config";
import { useLanguage } from "../../features/language/LanguageContext";
import { PaymentPageContent } from "../../features/payment/components/PaymentPageContent";
import { usePageMetadata } from "../../hooks/usePageMetadata";
import {
  isValidRegistrationId,
  normalizeRegistrationId
} from "../../lib/validation/registration-id";

function getSafeInvalidRegistrationId(value: string | undefined): string | null {
  const trimmedValue = value?.trim();

  if (!trimmedValue || trimmedValue.length > 80) {
    return null;
  }

  return trimmedValue;
}

export function PaymentPage() {
  const { localized } = useLanguage();
  const { registrationId } = useParams();
  const normalizedRegistrationId = normalizeRegistrationId(registrationId ?? "");
  const isValidRouteRegistrationId = isValidRegistrationId(registrationId ?? "");

  usePageMetadata({
    title: isValidRouteRegistrationId
      ? localized("पंजीकरण शुल्क भुगतान", "Registration fee payment")
      : localized("अमान्य पंजीकरण आईडी", "Invalid registration ID"),
    description: isValidRouteRegistrationId
      ? localized(
          "धोबी समाज पंजीकरण के लिए भुगतान निर्देश देखें और भुगतान प्रमाण तैयार करें।",
          "View payment instructions and prepare payment proof for Dhobi Samaj registration."
        )
      : localized(
          "भुगतान पृष्ठ खोलने के लिए मान्य पंजीकरण आईडी आवश्यक है।",
          "A valid registration ID is required to open the payment page."
        )
  });

  if (!isValidRouteRegistrationId) {
    const safeInvalidRegistrationId = getSafeInvalidRegistrationId(registrationId);

    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          action={
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <PrimaryButton to={routePaths.status}>{localized("पंजीकरण खोजें", "Find registration")}</PrimaryButton>
              <OutlineButton to={routePaths.home}>{localized("होम पेज पर जाएं", "Go to home page")}</OutlineButton>
            </div>
          }
          description={localized(
            "भुगतान पृष्ठ खोलने के लिए मान्य पंजीकरण आईडी आवश्यक है।",
            "A valid registration ID is required to open the payment page."
          )}
          title={localized("अमान्य पंजीकरण आईडी", "Invalid registration ID")}
        />
        {safeInvalidRegistrationId ? (
          <p className="mx-auto mt-4 max-w-xl break-words rounded-lg border border-maroon-700/10 bg-white px-4 py-3 text-center text-sm leading-7 text-brown-700 shadow-subtle">
            {localized("प्राप्त मान", "Received value")}: <span className="font-semibold text-maroon-900">{safeInvalidRegistrationId}</span>
          </p>
        ) : null}
      </div>
    );
  }

  return <PaymentPageContent registrationId={normalizedRegistrationId} />;
}
