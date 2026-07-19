import { AlertTriangle } from "lucide-react";
import { OutlineButton } from "../../../components/common/Button";
import { useLanguage } from "../../language/LanguageContext";
import type { PaymentStatus } from "../../../types/status";

type PaymentRejectionGuidanceProps = {
  paymentStatus: PaymentStatus;
  publicRejectionMessage: string | null;
  paymentResubmissionAllowed: boolean;
};

export function PaymentRejectionGuidance({
  paymentStatus,
  publicRejectionMessage,
  paymentResubmissionAllowed
}: PaymentRejectionGuidanceProps) {
  const { localized } = useLanguage();

  if (paymentStatus !== "rejected") {
    return null;
  }

  return (
    <section
      aria-labelledby="payment-rejection-guidance-title"
      className="rounded-lg border border-maroon-700/20 bg-maroon-50 p-4"
    >
      <h3
        className="flex items-start gap-2 text-base font-bold text-maroon-900"
        id="payment-rejection-guidance-title"
      >
        <AlertTriangle aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" />
        {localized("भुगतान प्रमाण के लिए मार्गदर्शन", "Payment-proof guidance")}
      </h3>
      <p className="mt-3 text-sm leading-7 text-brown-800">
        {localized(
          "आपका भुगतान प्रमाण स्वीकार नहीं किया गया। कृपया प्रशासन द्वारा दिए गए निर्देश देखें।",
          "Your payment proof was not accepted. Please review the instructions provided by administration."
        )}
      </p>
      {publicRejectionMessage ? (
        <p className="mt-3 rounded-md border border-maroon-700/10 bg-white p-3 text-sm leading-7 text-brown-800">
          {publicRejectionMessage}
        </p>
      ) : null}
      {paymentResubmissionAllowed ? (
        <div className="mt-4">
          <p className="mb-3 text-sm font-semibold leading-7 text-brown-800">
            {localized("आप नया भुगतान प्रमाण जमा कर सकते हैं।", "You can submit a new payment proof.")}
          </p>
          <OutlineButton disabled>{localized("नया भुगतान प्रमाण जमा करें", "Submit new payment proof")}</OutlineButton>
        </div>
      ) : null}
    </section>
  );
}
