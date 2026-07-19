import { CheckCircle2, CircleAlert } from "lucide-react";
import { useLanguage } from "../../language/LanguageContext";
import type { PaymentSettingsFormValues } from "../types/payment-settings.types";
import { isValidUpiId, normalizeUpiId } from "../../payment/utilities/upi.utils";
import {
  getFormattedDeadline,
  normalizeOptionalString,
  parsePaymentFeeInput
} from "../utilities/payment-settings.utils";

type PaymentConfigurationSummaryProps = {
  values: PaymentSettingsFormValues;
};

function SummaryRow({ label, value, complete }: { label: string; value: string; complete: boolean }) {
  const Icon = complete ? CheckCircle2 : CircleAlert;

  return (
    <div className="flex items-start justify-between gap-3 border-b border-maroon-700/10 py-3 last:border-b-0">
      <dt className="text-sm font-semibold text-brown-800">{label}</dt>
      <dd className="flex items-center gap-2 text-right text-sm font-bold text-maroon-900">
        <Icon
          aria-hidden="true"
          className={complete ? "h-4 w-4 text-communityGreen-700" : "h-4 w-4 text-saffron-600"}
        />
        {value}
      </dd>
    </div>
  );
}

export function PaymentConfigurationSummary({ values }: PaymentConfigurationSummaryProps) {
  const { language, localized } = useLanguage();
  const normalizedUpiId = normalizeUpiId(values.upiId);
  const hasQrCode = Boolean(values.qrCodeFile || normalizeOptionalString(values.existingQrCodePath));
  const hasPayeeName = (normalizeOptionalString(values.payeeName)?.length ?? 0) >= 2;
  const hasInstructions = (normalizeOptionalString(values.paymentInstructions)?.length ?? 0) >= 10;
  const hasPublicContact = (normalizeOptionalString(values.publicSupportContact)?.length ?? 0) >= 5;
  const feeValue = normalizeOptionalString(values.registrationFee);
  const hasValidFee = parsePaymentFeeInput(values.registrationFee) !== null;
  const hasValidUpiId = isValidUpiId(normalizedUpiId);
  const validLabel = localized("मान्य", "Valid");
  const invalidLabel = localized("अमान्य", "Invalid");
  const incompleteLabel = localized("अपूर्ण", "Incomplete");
  const enteredLabel = localized("दर्ज", "Entered");
  const notEnteredLabel = localized("दर्ज नहीं", "Not entered");
  const upiState = hasValidUpiId ? validLabel : normalizedUpiId ? invalidLabel : incompleteLabel;
  const feeState = hasValidFee ? validLabel : feeValue ? invalidLabel : incompleteLabel;

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle">
      <h2 className="text-xl font-bold text-maroon-900">
        {localized("कॉन्फ़िगरेशन सारांश", "Configuration summary")}
      </h2>
      <dl className="mt-3">
        <SummaryRow
          complete={values.paymentEnabled}
          label={localized("ऑनलाइन भुगतान", "Online payment")}
          value={values.paymentEnabled ? localized("सक्षम", "Enabled") : localized("अक्षम", "Disabled")}
        />
        <SummaryRow
          complete={hasQrCode}
          label={localized("QR स्थिति", "QR status")}
          value={hasQrCode ? localized("उपलब्ध", "Available") : localized("चयनित नहीं", "Not selected")}
        />
        <SummaryRow complete={hasValidUpiId} label={localized("UPI स्थिति", "UPI status")} value={upiState} />
        <SummaryRow complete={hasPayeeName} label={localized("प्राप्तकर्ता", "Recipient")} value={hasPayeeName ? enteredLabel : notEnteredLabel} />
        <SummaryRow complete={hasValidFee} label={localized("शुल्क", "Fee")} value={feeState} />
        <SummaryRow complete={hasInstructions} label={localized("निर्देश", "Instructions")} value={hasInstructions ? enteredLabel : notEnteredLabel} />
        <SummaryRow
          complete={hasPublicContact}
          label={localized("सहायता संपर्क", "Support contact")}
          value={hasPublicContact ? enteredLabel : notEnteredLabel}
        />
        <SummaryRow
          complete={Boolean(normalizeOptionalString(values.paymentDeadline))}
          label={localized("अंतिम तारीख", "Deadline")}
          value={getFormattedDeadline(values.paymentDeadline, language)}
        />
      </dl>
    </section>
  );
}
