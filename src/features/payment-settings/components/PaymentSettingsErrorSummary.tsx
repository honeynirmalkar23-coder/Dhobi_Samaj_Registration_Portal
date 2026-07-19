import { useLanguage } from "../../language/LanguageContext";
import type { PaymentSettingsFormErrors } from "../types/payment-settings.types";
import {
  paymentSettingsFieldIds,
  paymentSettingsFieldLabels,
  paymentSettingsFieldOrder
} from "../utilities/payment-settings.utils";

type PaymentSettingsErrorSummaryProps = {
  errors: PaymentSettingsFormErrors;
};

const paymentSettingsFieldLabelsEn = {
  paymentEnabled: "Online payment",
  qrCodeFile: "QR code",
  existingQrCodePath: "Existing QR code",
  upiId: "UPI ID",
  payeeName: "Recipient name",
  registrationFee: "Registration fee",
  paymentTitle: "Payment title",
  paymentInstructions: "Payment instructions",
  publicSupportContact: "Public support contact",
  paymentDeadline: "Payment deadline"
} as const satisfies Record<keyof typeof paymentSettingsFieldLabels, string>;

export function PaymentSettingsErrorSummary({ errors }: PaymentSettingsErrorSummaryProps) {
  const { language, localized } = useLanguage();
  const entries = paymentSettingsFieldOrder.filter((fieldName) => Boolean(errors[fieldName]));

  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="payment-settings-error-summary-title"
      className="rounded-lg border border-maroon-700/25 bg-maroon-50 p-4 text-maroon-900"
      role="alert"
      tabIndex={-1}
    >
      <h2 className="text-lg font-bold" id="payment-settings-error-summary-title">
        {localized("कृपया भुगतान सेटिंग्स जांचें", "Please check payment settings")}
      </h2>
      <ul className="mt-3 space-y-2 text-sm leading-7">
        {entries.map((fieldName) => (
          <li key={fieldName}>
            <button
              className="focus-ring rounded-md text-left font-semibold underline-offset-4 hover:underline"
              onClick={() => document.getElementById(paymentSettingsFieldIds[fieldName])?.focus()}
              type="button"
            >
              {language === "en" ? paymentSettingsFieldLabelsEn[fieldName] : paymentSettingsFieldLabels[fieldName]}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
