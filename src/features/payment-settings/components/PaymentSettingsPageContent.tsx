import { AlertTriangle } from "lucide-react";
import { DevelopmentNotice } from "../../../components/common/DevelopmentNotice";
import { PageHeader } from "../../../components/common/PageHeader";
import { useLanguage } from "../../language/LanguageContext";
import { getDataBackendMode } from "../../../services/backend/backend-mode";
import { PaymentSettingsForm } from "./PaymentSettingsForm";

export function PaymentSettingsPageContent() {
  const { localized } = useLanguage();
  const isLocalBackend = getDataBackendMode() === "local-dev";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description={localized(
          "सार्वजनिक भुगतान पृष्ठ पर प्रदर्शित होने वाले QR कोड, UPI विवरण, पंजीकरण शुल्क और भुगतान निर्देश तैयार करें।",
          "Prepare the QR code, UPI details, registration fee and payment instructions shown on the public payment page."
        )}
        eyebrow={localized("प्रशासनिक भुगतान प्रबंधन", "Administrative payment management")}
        title={localized("भुगतान सेटिंग्स", "Payment Settings")}
      />

      <DevelopmentNotice
        message={
          isLocalBackend
            ? localized(
                "स्थानीय परीक्षण डेटा सक्रिय है। भुगतान सेटिंग्स इस मशीन के स्थानीय SQLite डेटाबेस और निजी अपलोड फ़ोल्डर में सहेजी जाएंगी।",
                "Local test data is enabled. Payment settings will be saved to this machine's local SQLite database and private upload folder."
              )
            : localized(
                "भुगतान सेटिंग्स अब सुरक्षित प्रशासनिक सत्र, Supabase RLS और निजी QR स्टोरेज के माध्यम से सहेजी जाती हैं। सार्वजनिक पृष्ठ केवल सुरक्षित सार्वजनिक Edge Function से सक्रिय सेटिंग्स पढ़ता है।",
                "Payment settings are saved through secure administrator sessions, Supabase RLS and private QR storage. The public page reads active settings only through a secure public Edge Function."
              )
        }
      />

      {isLocalBackend ? (
        <div
          className="inline-flex w-fit rounded-full border border-communityGreen-600/25 bg-communityGreen-50 px-3 py-1 text-sm font-bold text-communityGreen-700"
          role="status"
        >
          {localized("स्थानीय परीक्षण डेटा", "Local test data")}
        </div>
      ) : null}

      <div
        className="flex gap-3 rounded-lg border border-saffron-500/30 bg-saffron-50 px-4 py-3 text-sm leading-7 text-brown-800"
        role="status"
      >
        <AlertTriangle aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-saffron-600" />
        <p>
          {localized(
            "सार्वजनिक उपयोग से पहले UPI आईडी, प्राप्तकर्ता का नाम, शुल्क और QR कोड का सावधानीपूर्वक सत्यापन करें।",
            "Carefully verify the UPI ID, recipient name, fee and QR code before public use."
          )}
        </p>
      </div>

      <PaymentSettingsForm />
    </div>
  );
}
