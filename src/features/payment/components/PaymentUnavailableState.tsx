import { AlertTriangle } from "lucide-react";
import { useLanguage } from "../../language/LanguageContext";

export function PaymentUnavailableState() {
  const { localized } = useLanguage();

  return (
    <div className="rounded-lg border border-saffron-500/30 bg-saffron-50 p-4 text-sm leading-7 text-brown-800">
      <div className="flex gap-3">
        <AlertTriangle aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-saffron-600" />
        <div>
          <p className="font-bold text-maroon-900">
            {localized("भुगतान सेटिंग्स अभी कॉन्फ़िगर नहीं हैं।", "Payment settings are not configured yet.")}
          </p>
          <p className="mt-1">
            {localized(
              "प्रशासन द्वारा QR कोड, UPI ID, भुगतान राशि और निर्देश सुरक्षित बैकएंड चरण में जोड़े जाएंगे।",
              "QR code, UPI ID, payment amount and instructions will be added by the administration through the secure backend."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
