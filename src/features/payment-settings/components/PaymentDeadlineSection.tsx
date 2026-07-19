import { Clock } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { FormField } from "../../../components/common/FormField";
import { useLanguage } from "../../language/LanguageContext";
import type { PaymentSettingsFormValues } from "../types/payment-settings.types";
import { paymentSettingsFieldIds } from "../utilities/payment-settings.utils";

export function PaymentDeadlineSection() {
  const { localized } = useLanguage();
  const {
    formState: { errors },
    register
  } = useFormContext<PaymentSettingsFormValues>();

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <div className="mb-5 space-y-2">
        <h2 className="text-xl font-bold text-maroon-900">
          {localized("भुगतान की अंतिम तारीख", "Payment deadline")}
        </h2>
        <p className="text-sm leading-7 text-brown-700">
          {localized(
            "खाली छोड़ने पर कोई सार्वजनिक अंतिम तारीख प्रदर्शित नहीं की जाएगी।",
            "If left blank, no public deadline will be displayed."
          )}
        </p>
      </div>

      <FormField
        error={errors.paymentDeadline?.message}
        hint={localized(
          "खाली छोड़ने पर कोई सार्वजनिक अंतिम तारीख प्रदर्शित नहीं की जाएगी।",
          "If left blank, no public deadline will be displayed."
        )}
        id={paymentSettingsFieldIds.paymentDeadline}
        label={localized("अंतिम तारीख और समय", "Deadline date and time")}
      >
        <input
          aria-describedby={
            errors.paymentDeadline
              ? `${paymentSettingsFieldIds.paymentDeadline}-hint ${paymentSettingsFieldIds.paymentDeadline}-error payment-settings-deadline-note`
              : `${paymentSettingsFieldIds.paymentDeadline}-hint payment-settings-deadline-note`
          }
          aria-invalid={Boolean(errors.paymentDeadline)}
          className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/20 bg-cream-50 px-3 py-2 text-brown-900"
          id={paymentSettingsFieldIds.paymentDeadline}
          type="datetime-local"
          {...register("paymentDeadline")}
        />
      </FormField>

      <p
        className="mt-4 flex gap-2 text-sm leading-7 text-brown-700"
        id="payment-settings-deadline-note"
      >
        <Clock aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-communityGreen-700" />
        {localized(
          "समय आपके वर्तमान डिवाइस के स्थानीय समय के अनुसार दर्ज होगा।",
          "Time will be entered according to your current device's local time."
        )}
      </p>
    </section>
  );
}
