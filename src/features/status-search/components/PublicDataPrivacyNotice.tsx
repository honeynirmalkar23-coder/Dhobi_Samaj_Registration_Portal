import { CheckCircle2, ShieldCheck } from "lucide-react";
import { SectionContainer } from "../../../components/common/SectionContainer";
import { useLanguage } from "../../language/LanguageContext";

const visibleItems = [
  { en: "Registration ID", hi: "पंजीकरण आईडी" },
  { en: "Partially masked name", hi: "आंशिक रूप से छिपा हुआ नाम" },
  { en: "Registration status", hi: "पंजीकरण स्थिति" },
  { en: "Payment status", hi: "भुगतान स्थिति" },
  { en: "Registration and update dates", hi: "पंजीकरण और अपडेट की तारीख" }
];

const hiddenItems = [
  { en: "Full permanent address", hi: "पूरा स्थायी पता" },
  { en: "Member photo", hi: "सदस्य का फोटो" },
  { en: "Payment screenshot", hi: "भुगतान स्क्रीनशॉट" },
  { en: "Detailed family information", hi: "परिवार का विस्तृत विवरण" },
  { en: "Administrative notes", hi: "प्रशासनिक टिप्पणी" },
  { en: "Internal record ID", hi: "आंतरिक रिकॉर्ड आईडी" }
];

export function PublicDataPrivacyNotice() {
  const { language, localized } = useLanguage();

  return (
    <SectionContainer
      description={localized(
        "सार्वजनिक परिणाम में केवल सीमित जानकारी दिखाई जाएगी।",
        "Only limited information will be shown in public results."
      )}
      title={localized("सार्वजनिक खोज में क्या दिखाई देगा?", "What appears in public search?")}
      variant="card"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-communityGreen-600/20 bg-communityGreen-50 p-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-communityGreen-700">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
            {localized("दिखाई देगा", "Will be visible")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-brown-800">
            {visibleItems.map((item) => (
              <li className="flex gap-2" key={item.hi}>
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-communityGreen-700" />
                <span>{language === "en" ? item.en : item.hi}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-maroon-700/10 bg-cream-50 p-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-maroon-900">
            <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            {localized("दिखाई नहीं देगा", "Will not be visible")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-brown-800">
            {hiddenItems.map((item) => (
              <li className="flex gap-2" key={item.hi}>
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-maroon-700" />
                <span>{language === "en" ? item.en : item.hi}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionContainer>
  );
}
