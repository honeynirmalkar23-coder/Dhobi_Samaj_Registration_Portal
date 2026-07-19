import { CheckCircle2, Circle, ClipboardCheck } from "lucide-react";
import { useLanguage } from "../../language/LanguageContext";
import type { PaymentSettingsFormValues } from "../types/payment-settings.types";
import { isValidUpiId, normalizeUpiId } from "../../payment/utilities/upi.utils";
import { parsePaymentFeeInput } from "../utilities/payment-settings.utils";

type PaymentSettingsChecklistProps = {
  values: PaymentSettingsFormValues;
};

function ChecklistItem({
  complete,
  label,
  manual,
  manualLabel
}: {
  complete: boolean;
  label: string;
  manual?: boolean;
  manualLabel: string;
}) {
  const Icon = complete ? CheckCircle2 : Circle;

  return (
    <li className="flex gap-3">
      <Icon
        aria-hidden="true"
        className={complete ? "mt-1 h-5 w-5 shrink-0 text-communityGreen-700" : "mt-1 h-5 w-5 shrink-0 text-brown-700"}
      />
      <span>
        <span className="block font-semibold text-brown-900">{label}</span>
        {manual ? (
          <span className="text-xs font-semibold text-saffron-600">{manualLabel}</span>
        ) : null}
      </span>
    </li>
  );
}

export function PaymentSettingsChecklist({ values }: PaymentSettingsChecklistProps) {
  const { localized } = useLanguage();
  const manualLabel = localized("स्वयं जांचें", "Check manually");

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle">
      <div className="flex items-start gap-3">
        <ClipboardCheck aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-maroon-700" />
        <div>
          <h2 className="text-xl font-bold text-maroon-900">{localized("सहेजने से पहले जांचें", "Check before saving")}</h2>
          <p className="mt-1 text-sm leading-7 text-brown-700">
            {localized(
              "बैकएंड चरण में सहेजने से पहले इन बातों की पुष्टि करें।",
              "Confirm these points before saving."
            )}
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-4 text-sm leading-7">
        <ChecklistItem complete={false} label={localized("QR कोड स्पष्ट और पूरा है", "QR code is clear and complete")} manual manualLabel={manualLabel} />
        <ChecklistItem
          complete={isValidUpiId(normalizeUpiId(values.upiId))}
          label={localized("UPI आईडी सही है", "UPI ID is correct")}
          manualLabel={manualLabel}
        />
        <ChecklistItem complete={values.payeeName.trim().length >= 2} label={localized("प्राप्तकर्ता का नाम सही है", "Recipient name is correct")} manualLabel={manualLabel} />
        <ChecklistItem complete={parsePaymentFeeInput(values.registrationFee) !== null} label={localized("पंजीकरण शुल्क सही है", "Registration fee is correct")} manualLabel={manualLabel} />
        <ChecklistItem complete={values.paymentInstructions.trim().length >= 10} label={localized("भुगतान निर्देश स्पष्ट हैं", "Payment instructions are clear")} manualLabel={manualLabel} />
        <ChecklistItem complete={values.publicSupportContact.trim().length >= 5} label={localized("सहायता संपर्क सही है", "Support contact is correct")} manualLabel={manualLabel} />
        <ChecklistItem complete={false} label={localized("उपयोगकर्ता से PIN, OTP या पासवर्ड नहीं मांगा गया है", "Users are not asked for PIN, OTP or password")} manual manualLabel={manualLabel} />
        <ChecklistItem complete={false} label={localized("पूर्वावलोकन जांच लिया गया है", "Preview has been checked")} manual manualLabel={manualLabel} />
      </ul>
    </section>
  );
}
