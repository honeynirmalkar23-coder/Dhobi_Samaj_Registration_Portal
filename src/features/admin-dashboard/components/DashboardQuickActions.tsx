import { ArrowRight, CreditCard, Home, ScrollText, UserCog } from "lucide-react";
import { Link } from "react-router-dom";
import { routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";

const quickActions = [
  {
    description: "प्रशासन नाम, ईमेल और पासवर्ड अपडेट करें।",
    descriptionEn: "Update the admin name, email and password.",
    icon: UserCog,
    label: "प्रशासन प्रोफाइल",
    labelEn: "Admin Profile",
    to: routePaths.adminProfile
  },
  {
    description: "QR, UPI और शुल्क सेटिंग्स प्रबंधित करें।",
    descriptionEn: "Manage QR, UPI and fee settings.",
    icon: CreditCard,
    label: "भुगतान सेटिंग्स",
    labelEn: "Payment Settings",
    to: routePaths.adminPaymentSettings
  },
  {
    description: "सुरक्षित गतिविधि लॉग देखें।",
    descriptionEn: "Review the secure activity log.",
    icon: ScrollText,
    label: "ऑडिट लॉग",
    labelEn: "Audit logs",
    to: routePaths.adminAuditLogs
  },
  {
    description: "सार्वजनिक पंजीकरण पोर्टल देखें।",
    descriptionEn: "View the public registration portal.",
    icon: Home,
    label: "सार्वजनिक पोर्टल देखें",
    labelEn: "View public portal",
    to: routePaths.home
  }
];

export function DashboardQuickActions() {
  const { language, localized } = useLanguage();

  return (
    <section aria-labelledby="dashboard-quick-actions-title">
      <h2 className="mb-4 text-xl font-bold text-maroon-900" id="dashboard-quick-actions-title">
        {localized("त्वरित कार्य", "Quick actions")}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              className="focus-ring group rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle transition-colors hover:border-maroon-700/25 hover:bg-maroon-50"
              key={action.to}
              to={action.to}
            >
              <Icon aria-hidden="true" className="h-6 w-6 text-maroon-700" />
              <h3 className="mt-4 flex items-center gap-2 text-base font-bold text-maroon-900">
                {language === "en" ? action.labelEn : action.label}
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </h3>
              <p className="mt-2 text-sm leading-7 text-brown-700">
                {language === "en" ? action.descriptionEn : action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
