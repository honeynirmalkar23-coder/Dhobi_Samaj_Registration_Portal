import { ToggleLeft, ToggleRight } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLanguage } from "../../language/LanguageContext";
import { cn } from "../../../lib/cn";
import type { PaymentSettingsFormValues } from "../types/payment-settings.types";
import { paymentSettingsFieldIds } from "../utilities/payment-settings.utils";

export function PaymentAvailabilitySection() {
  const { localized } = useLanguage();
  const { register } = useFormContext<PaymentSettingsFormValues>();
  const paymentEnabled = useWatch<PaymentSettingsFormValues>({
    name: "paymentEnabled"
  }) as boolean;

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-communityGreen-700">
          {localized("पूर्वावलोकन स्थिति", "Preview status")}
        </p>
        <h2 className="text-xl font-bold text-maroon-900">
          {localized("ऑनलाइन भुगतान की उपलब्धता", "Online payment availability")}
        </h2>
        <p className="text-sm leading-7 text-brown-700">
          {paymentEnabled
            ? localized(
                "सार्वजनिक भुगतान पृष्ठ के लिए QR कोड, UPI विवरण और शुल्क की जानकारी आवश्यक होगी।",
                "The public payment page will require QR code, UPI details and fee information."
              )
            : localized(
                "सार्वजनिक भुगतान पृष्ठ पर ऑनलाइन भुगतान उपलब्ध नहीं दिखाया जाएगा।",
                "Online payment will not be shown as available on the public payment page."
              )}
        </p>
      </div>

      <label
        className={cn(
          "mt-5 flex cursor-pointer flex-col gap-3 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
          paymentEnabled
            ? "border-communityGreen-600/40 bg-communityGreen-50"
            : "border-maroon-700/10 bg-cream-50"
        )}
        htmlFor={paymentSettingsFieldIds.paymentEnabled}
      >
        <span className="min-w-0">
          <span className="block text-base font-bold text-brown-900">
            {localized("ऑनलाइन भुगतान सक्षम करें", "Enable online payments")}
          </span>
          <span className="mt-1 block text-sm leading-7 text-brown-700">
            {localized(
              "यह केवल फॉर्म सत्यापन और पूर्वावलोकन को प्रभावित करता है।",
              "This only affects form validation and preview."
            )}
          </span>
        </span>
        <span className="flex items-center gap-3">
          {paymentEnabled ? (
            <ToggleRight aria-hidden="true" className="h-8 w-8 text-communityGreen-700" />
          ) : (
            <ToggleLeft aria-hidden="true" className="h-8 w-8 text-brown-700" />
          )}
          <input
            className="focus-ring h-6 w-6 rounded border-maroon-700/30 text-maroon-700"
            id={paymentSettingsFieldIds.paymentEnabled}
            type="checkbox"
            {...register("paymentEnabled")}
          />
        </span>
      </label>
    </section>
  );
}
