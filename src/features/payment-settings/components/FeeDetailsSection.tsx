import { FormField } from "../../../components/common/FormField";
import { useFormContext, useWatch } from "react-hook-form";
import { useLanguage } from "../../language/LanguageContext";
import type { PaymentSettingsFormValues } from "../types/payment-settings.types";
import {
  formatPaymentSettingsAmount,
  parsePaymentFeeInput,
  paymentSettingsFieldIds
} from "../utilities/payment-settings.utils";

export function FeeDetailsSection() {
  const { language, localized } = useLanguage();
  const {
    formState: { errors },
    register
  } = useFormContext<PaymentSettingsFormValues>();
  const registrationFee = useWatch<PaymentSettingsFormValues>({
    name: "registrationFee"
  }) as string;
  const parsedFee = parsePaymentFeeInput(registrationFee);

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <div className="mb-5 space-y-2">
        <h2 className="text-xl font-bold text-maroon-900">
          {localized("पंजीकरण शुल्क", "Registration fee")}
        </h2>
        <p className="text-sm leading-7 text-brown-700">
          {localized(
            "राशि भारतीय रुपये में दर्ज करें और भुगतान पृष्ठ पर दिखने वाला शीर्षक तैयार करें।",
            "Enter the amount in Indian rupees and prepare the title shown on the payment page."
          )}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          error={errors.registrationFee?.message}
          hint={localized("राशि भारतीय रुपये में दर्ज करें।", "Enter the amount in Indian rupees.")}
          id={paymentSettingsFieldIds.registrationFee}
          label={localized("पंजीकरण शुल्क", "Registration fee")}
          required
        >
          <div className="flex min-h-11 overflow-hidden rounded-md border border-maroon-700/20 bg-cream-50 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-saffron-500">
            <span className="flex min-w-11 items-center justify-center border-r border-maroon-700/10 bg-cream-100 font-bold text-maroon-900">
              ₹
            </span>
            <input
              aria-describedby={
                errors.registrationFee
                  ? `${paymentSettingsFieldIds.registrationFee}-hint ${paymentSettingsFieldIds.registrationFee}-error`
                  : `${paymentSettingsFieldIds.registrationFee}-hint`
              }
              aria-invalid={Boolean(errors.registrationFee)}
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-brown-900 outline-none placeholder:text-brown-700/60"
              id={paymentSettingsFieldIds.registrationFee}
              inputMode="decimal"
              placeholder={localized("उदाहरण: 500", "Example: 500")}
              type="text"
              {...register("registrationFee")}
            />
          </div>
          <p className="text-xs leading-6 text-communityGreen-700" role="status">
            {localized("पूर्वावलोकन", "Preview")}: {formatPaymentSettingsAmount(parsedFee, language)}
          </p>
        </FormField>

        <FormField
          error={errors.paymentTitle?.message}
          id={paymentSettingsFieldIds.paymentTitle}
          label={localized("भुगतान शीर्षक", "Payment title")}
          required
        >
          <input
            aria-describedby={
              errors.paymentTitle ? `${paymentSettingsFieldIds.paymentTitle}-error` : undefined
            }
            aria-invalid={Boolean(errors.paymentTitle)}
            className="focus-ring min-h-11 w-full rounded-md border border-maroon-700/20 bg-cream-50 px-3 py-2 text-brown-900 placeholder:text-brown-700/60"
            id={paymentSettingsFieldIds.paymentTitle}
            placeholder={localized(
              "उदाहरण: धोबी समाज सदस्य पंजीकरण शुल्क",
              "Example: Dhobi Samaj member registration fee"
            )}
            type="text"
            {...register("paymentTitle")}
          />
        </FormField>
      </div>
    </section>
  );
}
