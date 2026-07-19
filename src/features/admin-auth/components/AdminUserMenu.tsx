import { LogOut, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "../../../components/common/Button";
import { routePaths } from "../../../config/routes.config";
import { useLanguage } from "../../language/LanguageContext";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useState } from "react";

type AdminUserMenuProps = {
  compact?: boolean;
};

export function AdminUserMenu({ compact = false }: AdminUserMenuProps) {
  const { identity, signOut } = useAdminAuth();
  const { copy } = useLanguage();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();
  const displayLabel = identity?.displayName ?? identity?.email ?? "";
  const supportingLabel = identity?.displayName ? identity.email : copy.admin.administration;

  const handleLogout = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    await signOut();
    navigate(routePaths.adminLogin, {
      replace: true
    });
    setIsSigningOut(false);
  };

  return (
    <div className="flex min-w-0 items-center gap-3">
      {!compact && identity?.email ? (
        <div className="hidden min-w-0 text-right sm:block">
          <p className="text-xs font-semibold text-brown-700">{supportingLabel}</p>
          <p className="max-w-56 truncate text-sm font-bold text-maroon-900">{displayLabel}</p>
        </div>
      ) : null}
      {!compact ? <UserCircle aria-hidden="true" className="hidden h-8 w-8 shrink-0 text-maroon-700 sm:block" /> : null}
      <PrimaryButton disabled={isSigningOut} onClick={handleLogout}>
        <LogOut aria-hidden="true" className="h-5 w-5" />
        {isSigningOut ? copy.admin.logoutLoading : copy.admin.logout}
      </PrimaryButton>
    </div>
  );
}
