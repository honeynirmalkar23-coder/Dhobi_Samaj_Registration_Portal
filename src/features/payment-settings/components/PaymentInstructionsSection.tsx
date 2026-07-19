import { ShieldAlert } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormField } from "../../../components/common/FormField";
import { useLanguage } from "../../language/LanguageContext";
import type { PaymentSettingsFormValues } from "../types/payment-settings.types";
import { paymentSettingsFieldIds } from "../utilities/payment-settings.utils";

export function PaymentInstructionsSection() {
  const { localized } = useLanguage();
  const {
    formState: { errors },
    register
  } = useFormContext<PaymentSettingsFormValues>();
  const paymentInstructions = useWatch<PaymentSettingsFormValues>({
    name: "paymentInstructions"
  }) as string;

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <div className="mb-5 space-y-2">
        <h2 className="text-xl font-bold text-maroon-900">
          {localized("उपयोगकर्ता के लिए भुगतान निर्देश", "Payment instructions for users")}
        </h2>
        <p className="text-sm leading-7 text-brown-700">
          {localized(
            "भुगतान करने, स्क्रीनशॉट लेने और प्रमाण जमा करने से संबंधित स्पष्ट निर्देश लिखें।",
            "Write clear instructions about making payment, taking a screenshot and submitting proof."
          )}
        </p>
      </div>

      <FormField
        error={errors.paymentInstructions?.message}
        id={paymentSettingsFieldIds.paymentInstructions}
        label={localized("भुगतान निर्देश", "Payment instructions")}
        required
      >
        <textarea
          aria-describedby={
            errors.paymentInstructions
              ? `${paymentSettingsFieldIds.paymentInstructions}-counter ${paymentSettingsFieldIds.paymentInstructions}-error`
              : `${paymentSettingsFieldIds.paymentInstructions}-counter`
          }
          aria-invalid={Boolean(errors.paymentInstructions)}
          className="focus-ring min-h-36 w-full resize-y rounded-md border border-maroon-700/20 bg-cream-50 px-3 py-2 leading-7 text-brown-900 placeholder:text-brown-700/60"
          id={paymentSettingsFieldIds.paymentInstructions}
          maxLength={1200}
          placeholder={localized(
            "भुगतान करने, स्क्रीनशॉट लेने और प्रमाण जमा करने से संबंधित निर्देश लिखें।",
            "Write instructions about making payment, taking a screenshot and submitting proof."
          )}
          {...register("paymentInstructions")}
        />
        <p
          className="text-right text-xs font-semibold leading-6 text-brown-700"
          id={`${paymentSettingsFieldIds.paymentInstructions}-counter`}
        >
          {paymentInstructions.length} / 1000
        </p>
      </FormField>

      <p className="mt-4 flex gap-2 rounded-lg border border-communityGreen-600/20 bg-communityGreen-50 px-4 py-3 text-sm leading-7 text-brown-800">
        <ShieldAlert aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-communityGreen-700" />
        {localized(
          "निर्देशों में उपयोगकर्ता से UPI PIN, OTP, कार्ड नंबर या पासवर्ड मांगने वाली कोई जानकारी शामिल न करें।",
          "Do not include any instruction asking users for UPI PIN, OTP, card number or password."
        )}
      </p>
    </section>
  );
}
