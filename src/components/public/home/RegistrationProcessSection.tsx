import { BadgeCheck, FileCheck, FileText, ReceiptIndianRupee } from "lucide-react";
import { useLanguage } from "../../../features/language/LanguageContext";

const stepIcons = [FileText, BadgeCheck, ReceiptIndianRupee, FileCheck] as const;

export function RegistrationProcessSection() {
  const { copy } = useLanguage();

  return (
    <section className="bg-cream-50 py-12 sm:py-14">
      <div className="page-shell">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-maroon-900 sm:text-3xl">
            {copy.home.process.title}
          </h2>
          <p className="mt-3 text-base leading-8 text-brown-700">
            {copy.home.process.description}
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {copy.home.process.steps.map((step, index) => {
            const Icon = stepIcons[index] ?? FileText;

            return (
              <article
                className="relative rounded-lg border border-maroon-700/10 bg-white p-5 shadow-subtle transition-colors hover:border-saffron-500/40"
                key={step.title}
              >
                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-saffron-100 px-3 text-sm font-bold text-maroon-900">
                  {index + 1}
                </span>
                <Icon aria-hidden="true" className="mt-5 h-8 w-8 text-communityGreen-700" />
                <h3 className="mt-4 text-lg font-bold text-maroon-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-brown-700">{step.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
