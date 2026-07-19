import { useFormContext } from "react-hook-form";
import { useLanguage } from "../../language/LanguageContext";
import type { PaymentProofFormInputValues } from "../types/payment.types";
import { paymentProofFieldIds } from "../utilities/payment-file.utils";

export function PaymentDeclarationSection() {
  const { localized } = useLanguage();
  const {
    formState: { errors },
    register
  } = useFormContext<PaymentProofFormInputValues>();

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <h2 className="text-xl font-bold text-maroon-900">{localized("घोषणा", "Declaration")}</h2>
      <label
        className="focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-saffron-500 mt-4 flex cursor-pointer gap-3 rounded-lg border border-maroon-700/10 bg-cream-50 p-4 text-sm leading-7 text-brown-800"
        htmlFor={paymentProofFieldIds.declarationAccepted}
      >
        <input
          aria-describedby={
            errors.declarationAccepted
              ? `${paymentProofFieldIds.declarationAccepted}-error`
              : undefined
          }
          aria-invalid={Boolean(errors.declarationAccepted)}
          className="mt-1 h-5 w-5 shrink-0 rounded border-maroon-700/30 text-maroon-700 focus:ring-saffron-500"
          id={paymentProofFieldIds.declarationAccepted}
          type="checkbox"
          {...register("declarationAccepted")}
        />
        <span>
          {localized(
            "मैं पुष्टि करता/करती हूं कि चुना गया स्क्रीनशॉट मेरे भुगतान प्रमाण के रूप में प्रशासनिक समीक्षा हेतु सुरक्षित रूप से जमा किया जाएगा।",
            "I confirm that the selected screenshot will be securely submitted as my payment proof for administrative review."
          )}
          <span className="font-bold text-maroon-700"> *</span>
        </span>
      </label>
      {errors.declarationAccepted?.message ? (
        <p
          className="mt-3 text-sm font-semibold leading-7 text-maroon-700"
          id={`${paymentProofFieldIds.declarationAccepted}-error`}
          role="alert"
        >
          {errors.declarationAccepted.message}
        </p>
      ) : null}
    </section>
  );
}
