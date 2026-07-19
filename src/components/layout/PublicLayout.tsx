import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { routePaths } from "../../config/routes.config";
import { useLanguage } from "../../features/language/LanguageContext";
import { PublicFooter } from "../public/PublicFooter";
import { PublicHeader } from "../public/PublicHeader";

export function PublicLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === routePaths.home;
  const { copy } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-cream-100">
      <a
        className="focus-ring fixed left-4 top-4 z-[60] -translate-y-20 rounded-md bg-maroon-700 px-4 py-2 font-semibold text-white transition-transform focus:translate-y-0"
        href="#main-content"
      >
        {copy.common.skipToContent}
      </a>
      <PublicHeader />
      <main
        className={isHomePage ? "flex-1" : "page-shell flex-1 py-8 sm:py-10 lg:py-12"}
        id="main-content"
      >
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
