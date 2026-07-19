import { FormField } from "../../../components/common/FormField";
import { useFormContext, useWatch } from "react-hook-form";
import { useLanguage } from "../../language/LanguageContext";
import type { PaymentSettingsFormValues } from "../types/payment-settings.types";
import { paymentSettingsFieldIds } from "../utilities/payment-settings.utils";
import { isValidUpiId, normalizeUpiId } from "../../payment/utilities/upi.utils";

export function UpiDetailsSection() {
  const { localized } = useLanguage();
  const {
    control,
    formState: { errors },
    register
  } = useFormContext<PaymentSettingsFormValues>();
  const paymentEnabled = useWatch({
    control,
    name: "paymentEnabled"
  });
  const upiId = useWatch({
    control,
    name: "upiId"
  });
  const normalizedUpiId = normalizeUpiId(upiId);
  const liveUpiError = Boolean(paymentEnabled) && !errors.upiId
    ? !normalizedUpiId
      ? localized(
          "ऑनलाइन भुगतान सक्षम करने के लिए UPI आईडी दर्ज करें।",
          "Enter a UPI ID to enable online payments."
        )
      : !isValidUpiId(normalizedUpiId)
        ? localized("कृपया मान्य UPI आईडी दर्ज करें।", "Please enter a valid UPI ID.")
        : undefined
    : undefined;
  const upiError = errors.upiId?.message ?? liveUpiError;

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <div className="mb-5 space-y-2">
        <h2 className="text-xl font-bold text-maroon-900">
          {localized("UPI भुगतान विवरण", "UPI payment details")}
        </h2>
        <p className="text-sm leading-7 text-brown-700">
          {localized(
            "भुगतान भेजने से पहले उपयोगकर्ता इन्हीं विवरणों को देखकर पुष्टि करेगा।",
            "Users will verify these details before sending payment."
          )}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          error={upiError}
          hint={localized(
            "UPI आईडी को सावधानीपूर्वक जांचें। गलत UPI आईडी पर भुगतान भेजा जा सकता है।",
            "Check the UPI ID carefully. Payment may be sent to a wrong UPI ID."
          )}
          id={paymentSettingsFieldIds.upiId}
          label={localized("UPI आईडी", "UPI ID")}
          required
        >
          <input
            aria-describedby={
              upiError
                ? `${paymentSettingsFieldIds.upiId}-hint ${paymentSettingsFieldIds.upiId}-error`
                : `${paymentSettingsFieldIds.upiId}-hint`
            }
            aria-invalid={Boolean(upiError)}
            className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/20 bg-cream-50 px-3 py-2 text-brown-900 placeholder:text-brown-700/60"
            id={paymentSettingsFieldIds.upiId}
            placeholder={localized("उदाहरण: name@provider", "Example: name@provider")}
            type="text"
            {...register("upiId")}
          />
        </FormField>

        <FormField
          error={errors.payeeName?.message}
          hint={localized(
            "यह नाम उपयोगकर्ता को भुगतान से पहले सत्यापन के लिए दिखाया जाएगा।",
            "This name will be shown to users for verification before payment."
          )}
          id={paymentSettingsFieldIds.payeeName}
          label={localized("प्राप्तकर्ता का नाम", "Recipient name")}
          required
        >
          <input
            aria-describedby={
              errors.payeeName
                ? `${paymentSettingsFieldIds.payeeName}-hint ${paymentSettingsFieldIds.payeeName}-error`
                : `${paymentSettingsFieldIds.payeeName}-hint`
            }
            aria-invalid={Boolean(errors.payeeName)}
            className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/20 bg-cream-50 px-3 py-2 text-brown-900 placeholder:text-brown-700/60"
            id={paymentSettingsFieldIds.payeeName}
            placeholder={localized(
              "भुगतान प्राप्त करने वाले व्यक्ति या संस्था का नाम",
              "Name of the person or organization receiving payment"
            )}
            type="text"
            {...register("payeeName")}
          />
        </FormField>
      </div>
    </section>
  );
}
