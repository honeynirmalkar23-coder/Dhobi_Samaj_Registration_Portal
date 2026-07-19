import type { AdminAuthenticationMode } from "../features/admin-auth/types/admin-identity.types";

export function resolveAdminAuthenticationMode(params: {
  isDevelopment: boolean;
  requestedMode: string | undefined;
}): AdminAuthenticationMode {
  if (params.isDevelopment && params.requestedMode === "local-dev") {
    return "local-dev";
  }

  return "supabase";
}

export function getAdminAuthenticationMode(): AdminAuthenticationMode {
  return resolveAdminAuthenticationMode({
    isDevelopment: import.meta.env.DEV,
    requestedMode: import.meta.env.VITE_ADMIN_AUTH_MODE
  });
}
