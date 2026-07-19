import { CheckCircle2 } from "lucide-react";
import { communityImages } from "../../../config/images.config";
import { useLanguage } from "../../../features/language/LanguageContext";

export function PortalAboutSection() {
  const { copy } = useLanguage();

  return (
    <section className="bg-cream-100 py-12 sm:py-14">
      <div className="page-shell grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="order-1 overflow-hidden rounded-lg border border-maroon-700/10 bg-white p-2 shadow-soft lg:order-2">
          <img
            alt={copy.home.about.alt}
            className="aspect-[4/3] h-full w-full rounded-md object-cover"
            decoding="async"
            height={358}
            loading="lazy"
            src={communityImages.about}
            width={478}
          />
        </div>
        <div className="order-2 lg:order-1">
          <h2 className="text-2xl font-bold text-maroon-900 sm:text-3xl">
            {copy.home.about.title}
          </h2>
          <div className="mt-5 space-y-4 text-base leading-8 text-brown-700">
            {copy.home.about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className="mt-6 space-y-3">
            {copy.home.about.features.map((feature) => (
              <li className="flex gap-3 text-sm font-semibold leading-7 text-brown-800" key={feature}>
                <CheckCircle2 aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-communityGreen-700" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
