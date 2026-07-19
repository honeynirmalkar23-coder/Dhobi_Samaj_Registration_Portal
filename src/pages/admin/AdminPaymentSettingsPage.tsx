import { PaymentSettingsPageContent } from "../../features/payment-settings/components/PaymentSettingsPageContent";
import { useLanguage } from "../../features/language/LanguageContext";
import { usePageMetadata } from "../../hooks/usePageMetadata";

export function AdminPaymentSettingsPage() {
  const { localized } = useLanguage();

  usePageMetadata({
    title: localized("भुगतान सेटिंग्स", "Payment Settings"),
    description: localized(
      "धोबी समाज पंजीकरण शुल्क के QR कोड, UPI विवरण, राशि और भुगतान निर्देशों का प्रशासनिक प्रबंधन।",
      "Administrative management of QR code, UPI details, amount and payment instructions for Dhobi Samaj registration fee."
    )
  });

  return <PaymentSettingsPageContent />;
}
