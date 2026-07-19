import { AdminDashboardContent } from "../../features/admin-dashboard/components/AdminDashboardContent";
import { useLanguage } from "../../features/language/LanguageContext";
import { usePageMetadata } from "../../hooks/usePageMetadata";

export function AdminDashboardPage() {
  const { localized } = useLanguage();

  usePageMetadata({
    title: localized("प्रशासन डैशबोर्ड", "Admin Dashboard"),
    description: localized(
      "पंजीकरण, भुगतान सत्यापन और प्रशासनिक गतिविधियों का प्रबंधन करें।",
      "Manage registrations, payment verification and administrative activity."
    )
  });

  return <AdminDashboardContent />;
}
