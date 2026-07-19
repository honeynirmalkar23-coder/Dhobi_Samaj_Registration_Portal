import { PaymentUnavailableState } from "./PaymentUnavailableState";
import { formatPaymentAmount, isPaymentConfigured } from "../utilities/payment-display.utils";
import { useLanguage } from "../../language/LanguageContext";
import type { PublicPaymentSettings } from "../types/payment.types";

type PaymentConfigurationCardProps = {
  settings: PublicPaymentSettings;
};

export function PaymentConfigurationCard({ settings }: PaymentConfigurationCardProps) {
  const { language, localized } = useLanguage();
  const notConfigured = localized("कॉन्फ़िगर नहीं", "Not configured");

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <h2 className="text-xl font-bold text-maroon-900">
        {localized("भुगतान सेटिंग्स की स्थिति", "Payment settings status")}
      </h2>
      <div className="mt-4">
        {!isPaymentConfigured(settings) ? <PaymentUnavailableState /> : null}
      </div>
      <dl className="mt-4 divide-y divide-maroon-700/10 text-sm">
        <div className="grid gap-1 py-3 sm:grid-cols-2">
          <dt className="font-semibold text-brown-700">{localized("भुगतान स्थिति", "Payment status")}</dt>
          <dd className="font-semibold text-maroon-900">
            {settings.paymentEnabled ? localized("कॉन्फ़िगर", "Configured") : notConfigured}
          </dd>
        </div>
        <div className="grid gap-1 py-3 sm:grid-cols-2">
          <dt className="font-semibold text-brown-700">{localized("पंजीकरण शुल्क", "Registration fee")}</dt>
          <dd className="font-semibold text-maroon-900">{formatPaymentAmount(settings.amount, language)}</dd>
        </div>
        <div className="grid gap-1 py-3 sm:grid-cols-2">
          <dt className="font-semibold text-brown-700">{localized("सार्वजनिक संपर्क", "Public contact")}</dt>
          <dd className="font-semibold text-maroon-900">
            {settings.publicContact ?? notConfigured}
          </dd>
        </div>
      </dl>
    </section>
  );
}
