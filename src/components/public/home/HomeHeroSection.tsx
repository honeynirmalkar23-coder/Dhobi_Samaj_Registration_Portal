import { LockKeyhole, Search, UserPlus } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../../common/Button";
import { communityImages } from "../../../config/images.config";
import { routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../../features/language/LanguageContext";

export function HomeHeroSection() {
  const { copy } = useLanguage();

  return (
    <section className="relative isolate overflow-hidden bg-brown-900 text-white">
      <div className="page-shell relative flex min-h-[680px] items-center py-10 lg:py-16">

        {/* LEFT CONTENT */}
        <div className="relative z-20 w-full lg:w-[58%]">
          <p className="inline-flex items-center rounded-full border border-saffron-100/30 bg-brown-800/70 px-4 py-2 text-sm font-semibold text-saffron-100 backdrop-blur-sm">
            {copy.home.hero.eyebrow}
          </p>

          <div className="mt-6 flex items-start gap-5">
            <div className="hidden h-28 w-1 rounded-full bg-saffron-500 lg:block" />

            <div>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                {copy.home.hero.titleLineOne}
                <br />
                {copy.home.hero.titleLineTwo}
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-cream-100 sm:text-xl">
                {copy.home.hero.tagline}
              </p>

              <p className="mt-4 max-w-xl text-base leading-8 text-cream-200">
                {copy.home.hero.supportingText}
              </p>

              <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-brown-950/40 shadow-lg lg:hidden">
                <img
                  alt={copy.home.hero.alt}
                  className="aspect-square w-full object-contain"
                  decoding="async"
                  height={723}
                  loading="eager"
                  src={communityImages.hero}
                  width={720}
                />
              </div>

              <div className="mt-5 max-w-xl rounded-xl border border-saffron-100/20 bg-saffron-100/10 p-4 shadow-lg backdrop-blur-sm">
                <p className="text-xl font-bold leading-8 text-saffron-100">
                  {copy.home.hero.sloganLineOne}
                </p>
                <p className="mt-1 text-base font-semibold leading-7 text-white">
                  {copy.home.hero.sloganLineTwo}
                </p>

                <ul className="mt-4 grid gap-2 text-sm font-semibold leading-6 text-cream-100 sm:grid-cols-3">
                  {copy.home.hero.goalItems.map((item) => (
                    <li
                      className="flex min-h-14 items-start gap-2 rounded-lg border border-white/10 bg-brown-800/45 px-3 py-2"
                      key={item.text}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron-500 text-xs font-bold text-brown-900">
                        {item.marker}
                      </span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <PrimaryButton
                  className="h-14 rounded-xl bg-saffron-500 px-8 text-base font-semibold text-brown-900 shadow-lg transition hover:bg-saffron-600"
                  to={routePaths.registration}
                >
                  <UserPlus className="h-5 w-5" />
                  {copy.home.hero.ctaRegistration}
                </PrimaryButton>

                <SecondaryButton
                  className="h-14 rounded-xl border border-white/20 bg-white text-maroon-900 px-8 text-base font-semibold shadow-lg transition hover:bg-cream-50"
                  to={routePaths.status}
                >
                  <Search className="h-5 w-5" />
                  {copy.home.hero.ctaStatus}
                </SecondaryButton>
              </div>

              <div className="mt-8 flex max-w-xl gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-saffron-200" />

                <p className="text-sm leading-7 text-cream-100">
                  {copy.home.hero.privacy}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="absolute inset-y-0 right-0 hidden w-[42%] lg:flex items-center justify-end overflow-hidden">

          <img
            src={communityImages.hero}
            alt={copy.home.hero.alt}
            loading="eager"
            decoding="async"
            height={723}
            width={720}
            className="h-[92%] w-auto object-contain object-right drop-shadow-[0_15px_40px_rgba(0,0,0,0.55)]"
          />

          {/* Left Fade */}
          <div className="absolute inset-0 bg-gradient-to-r from-brown-900 via-brown-900/35 to-transparent pointer-events-none" />

          {/* Decorative Border */}
          <div className="absolute left-0 top-12 bottom-12 w-px bg-white/10" />
        </div>

      </div>
    </section>
  );
}
