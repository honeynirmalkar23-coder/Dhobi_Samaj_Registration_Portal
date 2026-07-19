import { SectionContainer } from "../../../components/common/SectionContainer";
import { useLanguage } from "../../language/LanguageContext";

const explanationCards = [
  {
    enText: "Registration has been created, but payment proof has not been submitted yet.",
    enTitle: "Awaiting payment",
    title: "भुगतान की प्रतीक्षा",
    text: "पंजीकरण बनाया गया है, लेकिन भुगतान प्रमाण अभी जमा नहीं किया गया है।"
  },
  {
    enText: "Payment proof has been received and is waiting for administrative verification.",
    enTitle: "Pending verification",
    title: "सत्यापन लंबित",
    text: "भुगतान प्रमाण प्राप्त हुआ है और प्रशासनिक सत्यापन की प्रतीक्षा है।"
  },
  {
    enText: "Registration and payment proof are being reviewed by administration.",
    enTitle: "Under review",
    title: "समीक्षा में",
    text: "पंजीकरण और भुगतान प्रमाण की प्रशासन द्वारा जांच की जा रही है।"
  },
  {
    enText: "Payment has been verified and registration has been approved.",
    enTitle: "Approved",
    title: "स्वीकृत",
    text: "भुगतान सत्यापित हो चुका है और पंजीकरण स्वीकृत किया गया है।"
  },
  {
    enText: "Registration or payment proof may need correction. Contact administration for more information.",
    enTitle: "Rejected",
    title: "अस्वीकृत",
    text: "पंजीकरण या भुगतान प्रमाण में सुधार की आवश्यकता हो सकती है। आगे की जानकारी के लिए प्रशासन से संपर्क करें।"
  }
];

export function StatusExplanationSection() {
  const { language, localized } = useLanguage();

  return (
    <SectionContainer
      description={localized(
        "नीचे दिए गए अर्थ सामान्य मार्गदर्शन के लिए हैं। अंतिम सत्यापन प्रशासन द्वारा किया जाएगा।",
        "The meanings below are general guidance. Final verification will be completed by administration."
      )}
      title={localized("स्थिति का अर्थ", "What each status means")}
      variant="card"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {explanationCards.map((card) => (
          <article
            className="rounded-lg border border-maroon-700/10 bg-cream-50 p-4"
            key={card.title}
          >
            <h3 className="text-base font-bold text-maroon-900">
              {language === "en" ? card.enTitle : card.title}
            </h3>
            <p className="mt-2 text-sm leading-7 text-brown-700">
              {language === "en" ? card.enText : card.text}
            </p>
          </article>
        ))}
      </div>
    </SectionContainer>
  );
}
