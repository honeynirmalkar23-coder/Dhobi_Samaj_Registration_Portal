import { useEffect, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import { AdminNavigationSidebar } from "../admin/AdminNavigationSidebar";
import { LanguageToggle } from "../common/LanguageToggle";
import { MobileNavigationDrawer } from "../common/MobileNavigationDrawer";
import { PageBreadcrumb } from "../common/PageBreadcrumb";
import { imagePaths } from "../../config/images.config";
import { routePaths, routePrefixes } from "../../config/routes.config";
import { AdminUserMenu } from "../../features/admin-auth/components/AdminUserMenu";
import { useLanguage } from "../../features/language/LanguageContext";

function getCurrentAdminLabel(pathname: string, adminCopy: ReturnType<typeof useLanguage>["copy"]["admin"]): string {
  if (pathname === routePaths.adminDashboard) {
    return adminCopy.dashboard;
  }

  if (pathname.startsWith(routePrefixes.adminRegistrations)) {
    return adminCopy.registrationDetail;
  }

  if (pathname === routePaths.adminProfile) {
    return adminCopy.profile;
  }

  if (pathname === routePaths.adminPaymentSettings) {
    return adminCopy.paymentSettings;
  }

  if (pathname === routePaths.adminAuditLogs) {
    return adminCopy.auditLogs;
  }

  return adminCopy.administration;
}

export function AdminLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const { copy } = useLanguage();
  const currentLabel = useMemo(
    () => getCurrentAdminLabel(location.pathname, copy.admin),
    [copy.admin, location.pathname]
  );

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-cream-100">
      <aside className="hidden w-72 shrink-0 border-r border-maroon-700/10 bg-cream-50 px-4 py-5 lg:block">
        <div className="mb-7 flex items-center gap-3">
          <img
            alt=""
            aria-hidden="true"
            className="h-11 w-11 shrink-0"
            src={imagePaths.logoPlaceholder}
          />
          <div className="min-w-0">
            <p className="text-sm font-bold leading-6 text-maroon-900">
              {copy.app.name}
            </p>
            <p className="text-xs font-semibold text-brown-700">{copy.admin.administration}</p>
          </div>
        </div>
        <AdminNavigationSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-maroon-700/10 bg-cream-50/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-controls="admin-mobile-navigation"
                aria-expanded={isDrawerOpen}
                aria-label={copy.admin.openMenu}
                className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-maroon-700/20 bg-white text-maroon-800 transition-colors hover:bg-maroon-50 lg:hidden"
                onClick={() => setIsDrawerOpen(true)}
                type="button"
              >
                <Menu aria-hidden="true" className="h-6 w-6" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-maroon-900 sm:text-base">
                  {copy.app.name}
                </p>
                <PageBreadcrumb
                  items={[
                    { label: copy.admin.administration },
                    { label: currentLabel }
                  ]}
                />
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <LanguageToggle />
              <AdminUserMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8" id="main-content">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={copy.admin.menu}
      >
        <div id="admin-mobile-navigation">
          <LanguageToggle className="mb-4" />
          <AdminNavigationSidebar onNavigate={() => setIsDrawerOpen(false)} />
        </div>
      </MobileNavigationDrawer>
    </div>
  );
}
