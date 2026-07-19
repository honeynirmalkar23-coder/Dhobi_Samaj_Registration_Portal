import { Search, UserPlus } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../../common/Button";
import { routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../../features/language/LanguageContext";

export function HomeCallToActionSection() {
  const { copy } = useLanguage();

  return (
    <section className="bg-maroon-800 py-12 text-white sm:py-14">
      <div className="page-shell">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            {copy.home.cta.title}
          </h2>
          <p className="mt-3 text-base leading-8 text-cream-100">
            {copy.home.cta.description}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <PrimaryButton className="border-saffron-500 bg-saffron-500 text-brown-900 hover:bg-saffron-600" to={routePaths.registration}>
              <UserPlus aria-hidden="true" className="h-5 w-5" />
              {copy.home.cta.registrationButton}
            </PrimaryButton>
            <SecondaryButton className="border-cream-50 bg-cream-50 text-maroon-900 hover:bg-white" to={routePaths.status}>
              <Search aria-hidden="true" className="h-5 w-5" />
              {copy.home.cta.statusButton}
            </SecondaryButton>
          </div>
          <p className="mt-5 text-sm leading-7 text-cream-200">
            {copy.home.cta.note}
          </p>
        </div>
      </div>
    </section>
  );
}
