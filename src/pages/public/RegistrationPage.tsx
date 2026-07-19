import { ShieldCheck } from "lucide-react";
import { DevelopmentNotice } from "../../components/common/DevelopmentNotice";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionContainer } from "../../components/common/SectionContainer";
import { useLanguage } from "../../features/language/LanguageContext";
import { RegistrationForm } from "../../features/registration/components/RegistrationForm";
import { usePageMetadata } from "../../hooks/usePageMetadata";

export function RegistrationPage() {
  const { localized } = useLanguage();

  usePageMetadata({
    title: localized(
      "नया सदस्य पंजीकरण | धोबी समाज पंजीकरण पोर्टल",
      "New Member Registration | Dhobi Samaj Registration Portal"
    ),
    description: localized(
      "धोबी समाज सदस्य पंजीकरण के लिए व्यक्तिगत, शैक्षणिक, पारिवारिक और पते की जानकारी दर्ज करें।",
      "Enter personal, education, family and address details for Dhobi Samaj member registration."
    )
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        description={localized(
          "कृपया सभी आवश्यक जानकारी सावधानीपूर्वक भरें। तारांकन (*) वाले क्षेत्र अनिवार्य हैं।",
          "Please fill all required information carefully. Fields marked with an asterisk (*) are required."
        )}
        eyebrow={localized("सदस्य पंजीकरण", "Member registration")}
        title={localized("नया सदस्य पंजीकरण", "New member registration")}
      />

      <SectionContainer variant="muted">
        <div className="flex gap-3 text-sm leading-7 text-brown-800">
          <ShieldCheck
            aria-hidden="true"
            className="mt-1 h-5 w-5 shrink-0 text-communityGreen-700"
          />
          <p>
            {localized(
              "आपके द्वारा दी गई जानकारी पंजीकरण और प्रशासनिक सत्यापन के उद्देश्य से उपयोग की जाएगी। संवेदनशील जानकारी सार्वजनिक रूप से प्रदर्शित नहीं की जाएगी।",
              "The information you provide will be used for registration and administrative verification. Sensitive information will not be displayed publicly."
            )}
          </p>
        </div>
      </SectionContainer>

      <DevelopmentNotice
        message={localized(
          "इस चरण में फॉर्म और सत्यापन तैयार किया जा रहा है। सुरक्षित सर्वर सबमिशन आगामी बैकएंड चरण में जोड़ा जाएगा।",
          "The form and validation are being prepared in this stage. Secure server submission will be connected in the backend stage."
        )}
      />

      <RegistrationForm />
    </div>
  );
}
