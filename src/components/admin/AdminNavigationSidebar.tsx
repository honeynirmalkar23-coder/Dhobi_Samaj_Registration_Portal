import { Link, NavLink } from "react-router-dom";
import { adminNavigation } from "../../config/navigation.config";
import { routePaths } from "../../config/routes.config";
import { useLanguage } from "../../features/language/LanguageContext";
import { cn } from "../../lib/cn";
import { AdminUserMenu } from "../../features/admin-auth/components/AdminUserMenu";

type AdminNavigationSidebarProps = {
  onNavigate?: () => void;
};

export function AdminNavigationSidebar({ onNavigate }: AdminNavigationSidebarProps) {
  const { copy } = useLanguage();

  const getLabel = (to: string) => {
    if (to === routePaths.adminDashboard) {
      return copy.admin.dashboard;
    }

    if (to === `${routePaths.adminDashboard}#registrations`) {
      return copy.admin.registrations;
    }

    if (to === routePaths.adminProfile) {
      return copy.admin.profile;
    }

    if (to === routePaths.adminPaymentSettings) {
      return copy.admin.paymentSettings;
    }

    if (to === routePaths.adminAuditLogs) {
      return copy.admin.auditLogs;
    }

    return copy.admin.returnToPortal;
  };

  return (
    <nav aria-label={copy.admin.menu} className="flex h-full flex-col">
      <ul className="flex-1 space-y-2">
        {adminNavigation.map((item) => {
          const Icon = item.icon;
          const label = getLabel(item.to);

          if (item.disabled) {
            return (
              <li key={label}>
                <span
                  aria-disabled="true"
                  className="flex min-h-12 cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-brown-700/65"
                  title={item.description}
                >
                  <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
                </span>
              </li>
            );
          }

          if (item.to === routePaths.home) {
            return (
              <li key={item.to}>
                <Link
                  className="focus-ring flex min-h-12 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-brown-800 transition-colors hover:bg-cream-200 hover:text-maroon-800"
                  onClick={onNavigate}
                  to={item.to}
                >
                  <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.to}>
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "focus-ring flex min-h-12 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-maroon-700 text-white"
                      : "text-brown-800 hover:bg-cream-200 hover:text-maroon-800"
                  )
                }
                end={item.end ?? false}
                onClick={onNavigate}
                to={item.to}
              >
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-maroon-700/10 pt-4">
        <AdminUserMenu compact />
      </div>
    </nav>
  );
}
