import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { LanguageToggle } from "../common/LanguageToggle";
import { imagePaths } from "../../config/images.config";
import { publicNavigation } from "../../config/navigation.config";
import { routePaths } from "../../config/routes.config";
import { useLanguage } from "../../features/language/LanguageContext";
import { cn } from "../../lib/cn";
import { MobileNavigationDrawer } from "../common/MobileNavigationDrawer";

const desktopLinkClasses =
  "focus-ring rounded-md px-3 py-2 text-sm font-semibold transition-colors";

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { copy } = useLanguage();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-maroon-700/10 bg-cream-50/95 backdrop-blur">
      <div className="page-shell flex min-h-16 items-center justify-between gap-4 py-3">
        <NavLink
          aria-label={`${copy.app.name} ${copy.navigation.home}`}
          className="focus-ring flex min-w-0 items-center gap-3 rounded-md"
          to={routePaths.home}
        >
          <img
            alt=""
            aria-hidden="true"
            className="h-11 w-11 shrink-0"
            src={imagePaths.logoPlaceholder}
          />
          <span className="min-w-0 text-base font-bold leading-6 text-maroon-900 sm:text-lg">
            {copy.app.name}
          </span>
        </NavLink>

        <div className="hidden items-center gap-3 lg:flex">
          <nav aria-label={copy.common.mainNavigation} className="flex items-center gap-1">
            {publicNavigation.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    desktopLinkClasses,
                    isActive
                      ? "bg-maroon-700 text-white"
                      : "text-brown-800 hover:bg-cream-200 hover:text-maroon-800"
                  )
                }
                end={item.end ?? false}
                key={item.to}
                to={item.to}
              >
                {item.to === routePaths.home
                  ? copy.navigation.home
                  : item.to === routePaths.registration
                    ? copy.navigation.registration
                    : item.to === routePaths.status
                      ? copy.navigation.status
                      : copy.navigation.adminLogin}
              </NavLink>
            ))}
          </nav>
          <LanguageToggle />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle className="shadow-none" />
          <button
            aria-controls="public-mobile-navigation"
            aria-expanded={isMenuOpen}
            aria-label={copy.common.openMobileMenu}
            className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-maroon-700/20 bg-white text-maroon-800 transition-colors hover:bg-maroon-50"
            onClick={() => setIsMenuOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
      </div>

      <MobileNavigationDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={copy.common.mobileMenu}
      >
        <nav aria-label={copy.common.mobileMainNavigation} id="public-mobile-navigation">
          <ul className="space-y-2">
            {publicNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.to}>
                  <NavLink
                    className={({ isActive }) =>
                      cn(
                        "focus-ring flex min-h-12 items-center gap-3 rounded-md px-3 py-2 text-base font-semibold transition-colors",
                        isActive
                          ? "bg-maroon-700 text-white"
                          : "text-brown-800 hover:bg-cream-200 hover:text-maroon-800"
                      )
                    }
                    end={item.end ?? false}
                    to={item.to}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                    <span>
                      {item.to === routePaths.home
                        ? copy.navigation.home
                        : item.to === routePaths.registration
                          ? copy.navigation.registration
                          : item.to === routePaths.status
                            ? copy.navigation.status
                            : copy.navigation.adminLogin}
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </MobileNavigationDrawer>
    </header>
  );
}
