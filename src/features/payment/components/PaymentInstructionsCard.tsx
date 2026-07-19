import { Info } from "lucide-react";
import { useLanguage } from "../../language/LanguageContext";
import type { PublicPaymentSettings } from "../types/payment.types";

type PaymentInstructionsCardProps = {
  settings: PublicPaymentSettings;
};

export function PaymentInstructionsCard({ settings }: PaymentInstructionsCardProps) {
  const { localized } = useLanguage();

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle sm:p-6">
      <h2 className="text-xl font-bold text-maroon-900">{localized("भुगतान निर्देश", "Payment instructions")}</h2>
      <div className="mt-4 flex gap-3 rounded-lg border border-communityGreen-600/20 bg-communityGreen-50 p-4 text-sm leading-7 text-brown-800">
        <Info aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-communityGreen-700" />
        <div className="space-y-2">
          <p>
            {localized(
              "प्रशासन द्वारा निर्देश कॉन्फ़िगर होने के बाद भुगतान करने की पूरी जानकारी यहां दिखाई जाएगी।",
              "Full payment information will appear here after instructions are configured by administration."
            )}
          </p>
          <p>
            {localized(
              "स्क्रीनशॉट चुनना या जमा करना भुगतान की अंतिम पुष्टि नहीं है। भुगतान का सत्यापन प्रशासन द्वारा किया जाएगा।",
              "Choosing or submitting a screenshot is not final payment confirmation. Payment will be verified by administration."
            )}
          </p>
          {settings.instructions ? <p>{settings.instructions}</p> : null}
        </div>
      </div>
    </section>
  );
}
