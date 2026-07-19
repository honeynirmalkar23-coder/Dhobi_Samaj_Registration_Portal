import { BadgeIndianRupee, SearchCheck, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../../features/language/LanguageContext";

const cardIcons = [ShieldCheck, BadgeIndianRupee, SearchCheck] as const;

export function PrivacyTransparencySection() {
  const { copy } = useLanguage();

  return (
    <section className="bg-cream-100 py-12 sm:py-14">
      <div className="page-shell">
        <h2 className="text-2xl font-bold text-maroon-900 sm:text-3xl">
          {copy.home.privacy.title}
        </h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {copy.home.privacy.cards.map((card, index) => {
            const Icon = cardIcons[index] ?? ShieldCheck;

            return (
              <article
                className="rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle"
                key={card.title}
              >
                <Icon aria-hidden="true" className="h-9 w-9 text-communityGreen-700" />
                <h3 className="mt-4 text-lg font-bold text-maroon-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-7 text-brown-700">{card.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
