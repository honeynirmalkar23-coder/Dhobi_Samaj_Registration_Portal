import type { PaymentProofFormInputValues, PublicPaymentSettings } from "../types/payment.types";
import { useLanguage } from "../../language/LanguageContext";
import { formatPaymentAmount } from "../utilities/payment-display.utils";
import { getPaymentProofProgress } from "../utilities/payment-file.utils";

type PaymentSummaryCardProps = {
  registrationId: string;
  settings: PublicPaymentSettings;
  values: PaymentProofFormInputValues;
};

export function PaymentSummaryCard({ registrationId, settings, values }: PaymentSummaryCardProps) {
  const { language, localized } = useLanguage();
  const progress = getPaymentProofProgress(values);

  return (
    <aside className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-soft lg:sticky lg:top-24">
      <h2 className="text-xl font-bold text-maroon-900">{localized("भुगतान सारांश", "Payment summary")}</h2>
      <dl className="mt-5 divide-y divide-maroon-700/10 text-sm">
        <div className="py-3">
          <dt className="font-semibold text-brown-700">{localized("पंजीकरण आईडी", "Registration ID")}</dt>
          <dd className="mt-1 break-words text-maroon-900">{registrationId}</dd>
        </div>
        <div className="py-3">
          <dt className="font-semibold text-brown-700">{localized("राशि", "Amount")}</dt>
          <dd className="mt-1 text-maroon-900">{formatPaymentAmount(settings.amount, language)}</dd>
        </div>
        <div className="py-3">
          <dt className="font-semibold text-brown-700">{localized("स्क्रीनशॉट", "Screenshot")}</dt>
          <dd className="mt-1 text-maroon-900">
            {values.paymentScreenshot
              ? localized("स्क्रीनशॉट चयनित", "Screenshot selected")
              : localized("स्क्रीनशॉट चयनित नहीं", "Screenshot not selected")}
          </dd>
        </div>
        <div className="py-3">
          <dt className="font-semibold text-brown-700">{localized("घोषणा", "Declaration")}</dt>
          <dd className="mt-1 text-maroon-900">
            {values.declarationAccepted
              ? localized("स्वीकार की गई", "Accepted")
              : localized("स्वीकार नहीं की गई", "Not accepted")}
          </dd>
        </div>
      </dl>
      <div className="mt-5 rounded-lg border border-saffron-500/25 bg-saffron-50 p-4">
        <p className="text-sm font-semibold text-brown-700">
          {localized("पूर्ण किए गए आवश्यक क्षेत्र", "Completed required fields")}
        </p>
        <p className="mt-1 text-2xl font-bold text-maroon-900">
          {progress.completed} / {progress.total}
        </p>
      </div>
    </aside>
  );
}
