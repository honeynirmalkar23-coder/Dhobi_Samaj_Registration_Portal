import { AdminProfilePageContent } from "../../features/admin-profile/components/AdminProfilePageContent";
import { useLanguage } from "../../features/language/LanguageContext";
import { usePageMetadata } from "../../hooks/usePageMetadata";

export function AdminProfilePage() {
  const { localized } = useLanguage();

  usePageMetadata({
    title: localized("प्रशासन प्रोफाइल", "Admin Profile"),
    description: localized(
      "प्रशासन लॉगिन के लिए नाम, ईमेल पता और पासवर्ड प्रबंधन।",
      "Name, email address and password management for admin login."
    )
  });

  return <AdminProfilePageContent />;
}
