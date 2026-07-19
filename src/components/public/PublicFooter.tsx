import { Link } from "react-router-dom";
import { routePaths } from "../../config/routes.config";
import { useLanguage } from "../../features/language/LanguageContext";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const { copy } = useLanguage();

  return (
    <footer className="border-t border-maroon-700/10 bg-brown-900 text-cream-50">
      <div className="page-shell grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <section className="space-y-3 sm:col-span-2">
          <h2 className="text-xl font-bold">{copy.app.name}</h2>
          <p className="text-sm font-semibold text-saffron-100">
            {copy.app.subtitle}
          </p>
          <p className="max-w-2xl text-sm leading-7 text-cream-200">
            {copy.app.footerDescription}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold">{copy.footer.contactHeading}</h2>
          <p className="text-sm leading-7 text-cream-200">
            {copy.footer.contactPlaceholder}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold">{copy.footer.portalInfoHeading}</h2>
          <ul className="space-y-2 text-sm leading-7 text-cream-200">
            <li>{copy.footer.privacyPlaceholder}</li>
            <li>{copy.footer.termsPlaceholder}</li>
            <li>
              <Link
                className="focus-ring rounded-md font-semibold text-saffron-100 hover:text-white"
                to={routePaths.adminLogin}
              >
                {copy.footer.adminLogin}
              </Link>
            </li>
          </ul>
        </section>
      </div>
      <div className="border-t border-cream-50/10 py-4">
        <div className="page-shell text-sm text-cream-200">
          © {currentYear} {copy.app.name}. {copy.footer.copyrightSuffix}
        </div>
      </div>
    </footer>
  );
}
