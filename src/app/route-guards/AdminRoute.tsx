import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { routePaths } from "../../config/routes.config";
import { AdminAccessDenied } from "../../features/admin-auth/components/AdminAccessDenied";
import { AdminAuthLoading } from "../../features/admin-auth/components/AdminAuthLoading";
import { AdminConfigurationRequired } from "../../features/admin-auth/components/AdminConfigurationRequired";
import { AdminSessionError } from "../../features/admin-auth/components/AdminSessionError";
import { useAdminAuth } from "../../features/admin-auth/hooks/useAdminAuth";

type AdminRouteProps = {
  children: ReactNode;
};

export function AdminRoute({ children }: AdminRouteProps) {
  const location = useLocation();
  const { status } = useAdminAuth();

  if (status === "configuration_missing") {
    return <AdminConfigurationRequired />;
  }

  if (status === "loading") {
    return <AdminAuthLoading />;
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`
        }}
        to={routePaths.adminLogin}
      />
    );
  }

  if (status === "authenticated_non_admin") {
    return <AdminAccessDenied />;
  }

  if (status === "error") {
    return <AdminSessionError />;
  }

  return <>{children}</>;
}
