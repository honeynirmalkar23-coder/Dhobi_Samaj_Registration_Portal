import { Copy, ExternalLink, QrCode } from "lucide-react";
import { useLanguage } from "../../language/LanguageContext";
import type { PaymentSettingsFormValues } from "../types/payment-settings.types";
import {
  formatPaymentSettingsAmount,
  getFormattedDeadline,
  normalizeOptionalString,
  parsePaymentFeeInput
} from "../utilities/payment-settings.utils";
import { normalizeUpiId } from "../../payment/utilities/upi.utils";
import { createSafeUpiPreview } from "../utilities/upi-preview.utils";

type PaymentSettingsPreviewProps = {
  values: PaymentSettingsFormValues;
  qrPreviewUrl: string | null;
};

export function PaymentSettingsPreview({ values, qrPreviewUrl }: PaymentSettingsPreviewProps) {
  const { language, localized } = useLanguage();
  const paymentEnabled = Boolean(values.paymentEnabled);
  const trimmedUpiId = normalizeUpiId(values.upiId);
  const amount = parsePaymentFeeInput(values.registrationFee);
  const paymentTitle = normalizeOptionalString(values.paymentTitle);
  const payeeName = normalizeOptionalString(values.payeeName);
  const paymentInstructions = normalizeOptionalString(values.paymentInstructions);
  const publicSupportContact = normalizeOptionalString(values.publicSupportContact);
  const upiPreview = createSafeUpiPreview({
    amount: values.registrationFee,
    payeeName: values.payeeName,
    paymentTitle: values.paymentTitle,
    upiId: values.upiId
  });

  if (!paymentEnabled) {
    return (
      <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-maroon-900">
            {localized("सार्वजनिक भुगतान पृष्ठ का पूर्वावलोकन", "Preview of the public payment page")}
          </h2>
          <span className="rounded-full border border-saffron-500/40 bg-saffron-50 px-3 py-1 text-xs font-bold text-brown-800">
            {localized("केवल पूर्वावलोकन", "Preview only")}
          </span>
        </div>
        <div className="mt-5 rounded-lg border border-maroon-700/10 bg-cream-50 p-4">
          <h3 className="text-lg font-bold text-maroon-900">
            {localized("ऑनलाइन भुगतान फिलहाल उपलब्ध नहीं है", "Online payment is currently unavailable")}
          </h3>
          <p className="mt-2 text-sm leading-7 text-brown-700">
            {localized("कृपया प्रशासन से संपर्क करें।", "Please contact the administration.")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-xl font-bold text-maroon-900">
          {localized("सार्वजनिक भुगतान पृष्ठ का पूर्वावलोकन", "Preview of the public payment page")}
        </h2>
        <span className="w-fit rounded-full border border-saffron-500/40 bg-saffron-50 px-3 py-1 text-xs font-bold text-brown-800">
          {localized("केवल पूर्वावलोकन", "Preview only")}
        </span>
      </div>

      <div className="mt-5 space-y-5 rounded-lg border border-maroon-700/10 bg-cream-50 p-4">
        <div>
          <p className="text-xs font-semibold text-communityGreen-700">
            {localized("पंजीकरण शुल्क", "Registration fee")}
          </p>
          <h3 className="mt-1 break-words text-lg font-bold text-maroon-900">
            {paymentTitle ?? localized("भुगतान शीर्षक दर्ज नहीं है", "Payment title is not entered")}
          </h3>
        </div>

        <div className="rounded-lg border border-maroon-700/10 bg-white p-3">
          {qrPreviewUrl ? (
            <img
              alt={localized("चयनित भुगतान QR कोड का पूर्वावलोकन", "Selected payment QR code preview")}
              className="aspect-square w-full object-contain"
              src={qrPreviewUrl}
            />
          ) : (
            <div className="flex aspect-square flex-col items-center justify-center gap-3 text-center text-brown-700">
              <QrCode aria-hidden="true" className="h-12 w-12 text-maroon-700" />
              <p className="font-semibold">{localized("QR कोड चयनित नहीं है", "QR code is not selected")}</p>
            </div>
          )}
        </div>

        <dl className="space-y-3 text-sm leading-7 text-brown-700">
          <div>
            <dt className="font-semibold text-brown-900">{localized("UPI आईडी", "UPI ID")}</dt>
            <dd className="break-words">{trimmedUpiId || localized("अपूर्ण", "Incomplete")}</dd>
          </div>
          <div>
            <dt className="font-semibold text-brown-900">{localized("प्राप्तकर्ता", "Recipient")}</dt>
            <dd className="break-words">{payeeName ?? localized("अपूर्ण", "Incomplete")}</dd>
          </div>
          <div>
            <dt className="font-semibold text-brown-900">{localized("राशि", "Amount")}</dt>
            <dd>{formatPaymentSettingsAmount(amount, language)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-brown-900">{localized("निर्देश", "Instructions")}</dt>
            <dd className="whitespace-pre-wrap break-words">
              {paymentInstructions ?? localized("अपूर्ण", "Incomplete")}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-brown-900">{localized("सहायता संपर्क", "Support contact")}</dt>
            <dd className="break-words">{publicSupportContact ?? localized("अपूर्ण", "Incomplete")}</dd>
          </div>
          <div>
            <dt className="font-semibold text-brown-900">{localized("अंतिम तारीख", "Deadline")}</dt>
            <dd>{getFormattedDeadline(values.paymentDeadline, language)}</dd>
          </div>
        </dl>

        <div className="space-y-3 rounded-lg border border-communityGreen-600/20 bg-communityGreen-50 p-3 text-sm leading-7 text-brown-800">
          <p className="font-semibold">
            {upiPreview.status === "ready"
              ? localized("UPI लिंक तैयार हो सकता है", "UPI link can be ready")
              : upiPreview.message}
          </p>
          <div className="flex flex-col gap-3">
            <button
              className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-maroon-700/20 bg-white px-4 py-2 font-semibold text-brown-700 opacity-75"
              disabled
              title={localized("पूर्वावलोकन में उपलब्ध नहीं", "Not available in preview")}
              type="button"
            >
              <ExternalLink aria-hidden="true" className="h-5 w-5" />
              {localized("UPI ऐप खोलें", "Open UPI app")}
            </button>
            <button
              className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-maroon-700/20 bg-white px-4 py-2 font-semibold text-brown-700 opacity-75"
              disabled
              title={localized("पूर्वावलोकन में उपलब्ध नहीं", "Not available in preview")}
              type="button"
            >
              <Copy aria-hidden="true" className="h-5 w-5" />
              {localized("UPI आईडी कॉपी करें", "Copy UPI ID")}
            </button>
            <p className="text-xs font-semibold text-brown-700">
              {localized("पूर्वावलोकन में उपलब्ध नहीं", "Not available in preview")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
