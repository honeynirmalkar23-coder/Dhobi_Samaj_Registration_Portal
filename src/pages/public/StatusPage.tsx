import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../../features/language/LanguageContext";
import { StatusSearchPageContent } from "../../features/status-search/components/StatusSearchPageContent";
import { usePageMetadata } from "../../hooks/usePageMetadata";

export function StatusPage() {
  const { localized } = useLanguage();
  const [searchParams] = useSearchParams();
  const queryRegistrationId = searchParams.get("registrationId") ?? "";

  usePageMetadata({
    title: localized("पंजीकरण स्थिति खोजें", "Find registration status"),
    description: localized(
      "पंजीकरण आईडी के माध्यम से धोबी समाज सदस्य पंजीकरण और भुगतान सत्यापन की सीमित स्थिति जानकारी देखें।",
      "View limited registration and payment-verification status using a registration ID."
    )
  });

  return <StatusSearchPageContent queryRegistrationId={queryRegistrationId} />;
}
