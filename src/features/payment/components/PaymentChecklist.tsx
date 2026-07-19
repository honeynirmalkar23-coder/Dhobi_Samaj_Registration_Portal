import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "../../language/LanguageContext";

const checklist = [
  {
    en: "Registration ID is correct.",
    hi: "पंजीकरण आईडी सही है।"
  },
  {
    en: "Pay only after payment instructions are configured by administration.",
    hi: "भुगतान निर्देश प्रशासन द्वारा कॉन्फ़िगर होने पर ही भुगतान करें।"
  },
  {
    en: "Screenshot should be clear and readable.",
    hi: "स्क्रीनशॉट साफ और पढ़ने योग्य होना चाहिए।"
  },
  {
    en: "Read the declaration before submitting payment proof.",
    hi: "भुगतान प्रमाण जमा करने से पहले घोषणा पढ़ें।"
  }
] as const;

export function PaymentChecklist() {
  const { language, localized } = useLanguage();

  return (
    <section className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-soft">
      <h2 className="text-xl font-bold text-maroon-900">{localized("जमा करने से पहले", "Before submitting")}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-brown-700">
        {checklist.map((item) => (
          <li className="flex gap-3" key={item.hi}>
            <CheckCircle2 aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-communityGreen-700" />
            <span>{language === "en" ? item.en : item.hi}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
