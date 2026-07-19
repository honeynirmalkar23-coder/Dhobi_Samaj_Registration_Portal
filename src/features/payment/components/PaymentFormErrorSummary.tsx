import { useLanguage } from "../../language/LanguageContext";
import type { PaymentProofFormErrors } from "../types/payment.types";
import { paymentProofFieldIds, paymentProofFieldLabels } from "../utilities/payment-file.utils";

type PaymentFormErrorSummaryProps = {
  errors: PaymentProofFormErrors;
};

const paymentProofFieldLabelsEn = {
  declarationAccepted: "Declaration",
  paymentScreenshot: "Payment screenshot"
} as const satisfies Record<keyof typeof paymentProofFieldLabels, string>;

export function PaymentFormErrorSummary({ errors }: PaymentFormErrorSummaryProps) {
  const { language, localized } = useLanguage();
  const entries = Object.keys(paymentProofFieldLabels)
    .filter((fieldName) => fieldName in errors)
    .map((fieldName) => fieldName as keyof typeof paymentProofFieldLabels);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="payment-error-summary-title"
      className="rounded-lg border border-maroon-700/25 bg-maroon-50 p-4 text-maroon-900"
      role="alert"
      tabIndex={-1}
    >
      <h2 className="text-lg font-bold" id="payment-error-summary-title">
        {localized("कृपया भुगतान प्रमाण की जानकारी जांचें", "Please check payment-proof information")}
      </h2>
      <ul className="mt-3 space-y-3 text-sm leading-7">
        {entries.map((fieldName) => (
          <li key={fieldName}>
            <button
              className="focus-ring rounded-md text-left font-semibold underline-offset-4 hover:underline"
              onClick={() => {
                document.getElementById(paymentProofFieldIds[fieldName])?.focus();
              }}
              type="button"
            >
              {language === "en" ? paymentProofFieldLabelsEn[fieldName] : paymentProofFieldLabels[fieldName]}
            </button>
            {errors[fieldName]?.message ? (
              <p className="mt-1 text-maroon-800">{errors[fieldName]?.message}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
