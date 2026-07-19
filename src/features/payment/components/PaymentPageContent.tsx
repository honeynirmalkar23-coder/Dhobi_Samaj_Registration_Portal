import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ErrorState } from "../../../components/common/ErrorState";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { PageHeader } from "../../../components/common/PageHeader";
import { OutlineButton, PrimaryButton } from "../../../components/common/Button";
import { useLanguage } from "../../language/LanguageContext";
import { getPaymentAccessToken, getPublicPaymentSettings } from "../../../services/payment.service";
import { getPublicRegistrationStatus } from "../../../services/status-search.service";
import type { PublicRegistrationStatus } from "../../status-search/types/status-search.types";
import type { PublicPaymentSettings } from "../types/payment.types";
import { isPaymentConfigured, placeholderPaymentSettings } from "../utilities/payment-display.utils";
import { PaymentChecklist } from "./PaymentChecklist";
import { PaymentConfigurationCard } from "./PaymentConfigurationCard";
import { PaymentInstructionsCard } from "./PaymentInstructionsCard";
import { PaymentProofForm } from "./PaymentProofForm";
import { QrCodeDisplay } from "./QrCodeDisplay";
import { RegistrationReferenceCard } from "./RegistrationReferenceCard";
import { UpiPaymentDetails } from "./UpiPaymentDetails";

type PaymentPageContentProps = {
  registrationId: string;
};

export function PaymentPageContent({ registrationId }: PaymentPageContentProps) {
  const { localized } = useLanguage();
  const [settings, setSettings] = useState<PublicPaymentSettings>(placeholderPaymentSettings);
  const [paymentAccessToken, setPaymentAccessToken] = useState<string | null>(null);
  const [publicStatus, setPublicStatus] = useState<PublicRegistrationStatus | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");

  const loadSettings = useCallback(async () => {
    setLoadState("loading");
    const [result, statusResult] = await Promise.all([
      getPublicPaymentSettings(),
      getPublicRegistrationStatus(registrationId)
    ]);

    if (!result.ok) {
      setLoadState("error");
      return;
    }

    setSettings(result.data);
    setPublicStatus(statusResult.ok ? statusResult.data : null);
    setPaymentAccessToken(getPaymentAccessToken(registrationId));
    setLoadState("loaded");
  }, [registrationId]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  if (loadState === "loading") {
    return (
      <div className="mx-auto flex max-w-3xl justify-center rounded-lg border border-maroon-700/10 bg-white p-8 shadow-subtle">
        <LoadingSpinner label={localized("भुगतान सेटिंग्स लोड हो रही हैं…", "Payment settings are loading…")} />
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <ErrorState
        action={
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <PrimaryButton onClick={() => void loadSettings()}>{localized("पुनः प्रयास करें", "Try again")}</PrimaryButton>
            <OutlineButton to="/">{localized("होम पेज पर जाएं", "Go to home page")}</OutlineButton>
          </div>
        }
        description={localized(
          "भुगतान सेटिंग्स अभी प्राप्त नहीं हो सकीं। कृपया कुछ समय बाद पुनः प्रयास करें।",
          "Payment settings could not be loaded right now. Please try again after some time."
        )}
        title={localized("भुगतान जानकारी लोड नहीं हुई", "Payment information did not load")}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        description={localized(
          "प्रशासन द्वारा निर्धारित QR कोड या UPI विवरण के माध्यम से भुगतान करने के बाद भुगतान का स्क्रीनशॉट तैयार रखें।",
          "After paying through the QR code or UPI details set by the administration, keep the payment screenshot ready."
        )}
        eyebrow={localized("पंजीकरण शुल्क", "Registration fee")}
        title={localized("भुगतान और प्रमाण जमा करना", "Payment and proof submission")}
      />

      <div
        className="flex gap-3 rounded-lg border border-saffron-500/30 bg-saffron-50 px-4 py-3 text-sm leading-7 text-brown-800"
        role="status"
      >
        <AlertTriangle aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-saffron-600" />
        <p>
          {localized(
            "स्क्रीनशॉट चुनना या जमा करना भुगतान की अंतिम पुष्टि नहीं है। भुगतान का सत्यापन प्रशासन द्वारा किया जाएगा।",
            "Choosing or submitting a screenshot is not final payment confirmation. Payment will be verified by administration."
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <RegistrationReferenceCard registrationId={registrationId} />
          <PaymentConfigurationCard settings={settings} />
          <div className="grid gap-6 md:grid-cols-2">
            <QrCodeDisplay settings={settings} />
            <UpiPaymentDetails settings={settings} />
          </div>
          <PaymentInstructionsCard settings={settings} />
          {!paymentAccessToken ? (
            <section
              className="rounded-lg border border-saffron-500/30 bg-saffron-50 p-5 text-sm leading-7 text-brown-800 shadow-subtle sm:p-6"
              role="status"
            >
              <h2 className="text-xl font-bold text-maroon-900">
                {localized("भुगतान प्रमाण अनुमति उपलब्ध नहीं है", "Payment proof permission is unavailable")}
              </h2>
              <p className="mt-3">
                {localized(
                  "इस ब्राउज़र सत्र में भुगतान प्रमाण जमा करने की अनुमति उपलब्ध नहीं है। कृपया उसी पंजीकरण प्रक्रिया से भुगतान पृष्ठ खोलें या प्रशासन से संपर्क करें।",
                  "This browser session does not have permission to submit payment proof. Please open the payment page from the same registration flow or contact administration."
                )}
              </p>
            </section>
          ) : null}
          {isPaymentConfigured(settings) && paymentAccessToken ? (
            <PaymentProofForm
              paymentAccessToken={paymentAccessToken}
              paymentResubmissionAllowed={publicStatus?.paymentResubmissionAllowed ?? false}
              registrationId={registrationId}
              settings={settings}
            />
          ) : null}
        </div>
        <PaymentChecklist />
      </div>
    </div>
  );
}
