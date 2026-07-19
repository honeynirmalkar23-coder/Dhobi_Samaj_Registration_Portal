import { FormField } from "../../../components/common/FormField";
import { useFormContext } from "react-hook-form";
import { useLanguage } from "../../language/LanguageContext";
import type { PaymentSettingsFormValues } from "../types/payment-settings.types";
import { paymentSettingsFieldIds } from "../utilities/payment-settings.utils";

export function PublicContactSection() {
  const { localized } = useLanguage();
  const {
    formState: { errors },
    register
  } = useFormContext<PaymentSettingsFormValues>();

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <div className="mb-5 space-y-2">
        <h2 className="text-xl font-bold text-maroon-900">
          {localized("भुगतान सहायता संपर्क", "Payment support contact")}
        </h2>
        <p className="text-sm leading-7 text-brown-700">
          {localized(
            "यह संपर्क भुगतान संबंधी सहायता के लिए उपयोगकर्ता को दिखाया जाएगा।",
            "This contact will be shown to users for payment-related support."
          )}
        </p>
      </div>

      <FormField
        error={errors.publicSupportContact?.message}
        hint={localized("फोन नंबर, ईमेल या कार्यालय संपर्क लिखें।", "Enter a phone number, email or office contact.")}
        id={paymentSettingsFieldIds.publicSupportContact}
        label={localized("सार्वजनिक सहायता संपर्क", "Public support contact")}
        required
      >
        <input
          aria-describedby={
            errors.publicSupportContact
              ? `${paymentSettingsFieldIds.publicSupportContact}-hint ${paymentSettingsFieldIds.publicSupportContact}-error`
              : `${paymentSettingsFieldIds.publicSupportContact}-hint`
          }
          aria-invalid={Boolean(errors.publicSupportContact)}
          className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/20 bg-cream-50 px-3 py-2 text-brown-900 placeholder:text-brown-700/60"
          id={paymentSettingsFieldIds.publicSupportContact}
          placeholder={localized("फोन नंबर, ईमेल या कार्यालय संपर्क", "Phone number, email or office contact")}
          type="text"
          {...register("publicSupportContact")}
        />
      </FormField>
    </section>
  );
}
