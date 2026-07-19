import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getAdminAuthenticationMode } from "../../../config/admin-auth-mode.config";
import { getSupabaseConfiguration } from "../../../lib/supabase/configuration";
import {
  createSupabaseAdminIdentity,
  getConfiguredSupabaseClient,
  restoreAdminSession,
  signInAdministrator,
  signOutAdministrator
} from "../services/admin-auth.service";
import type { AdminIdentity } from "../types/admin-identity.types";
import type {
  AdminAuthContextValue,
  AdminAuthStatus,
  AdminConfigurationState,
  AdminSignInResult
} from "../types/admin-auth.types";
import { isAdministratorUser } from "../utilities/admin-role";

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

type AdminAuthProviderProps = {
  children: ReactNode;
};

function getStatusForUser(user: User | null): AdminAuthStatus {
  if (!user) {
    return "unauthenticated";
  }

  return isAdministratorUser(user) ? "authenticated_admin" : "authenticated_non_admin";
}

function getSupabaseMissingVariables(state: AdminConfigurationState): string[] {
  if (state === "missing_url") {
    return ["VITE_SUPABASE_URL"];
  }

  if (state === "missing_anon_key") {
    return ["VITE_SUPABASE_ANON_KEY"];
  }

  return [];
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const authenticationMode = useMemo(() => getAdminAuthenticationMode(), []);
  const configuration = authenticationMode === "supabase" ? getSupabaseConfiguration() : null;
  const [configurationState, setConfigurationState] = useState<AdminConfigurationState>(
    configuration?.state ?? "configured"
  );
  const [status, setStatus] = useState<AdminAuthStatus>(
    authenticationMode === "supabase" && configuration?.state !== "configured"
      ? "configuration_missing"
      : "loading"
  );
  const [user, setUser] = useState<User | null>(null);
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [missingConfigurationVariables, setMissingConfigurationVariables] = useState<string[]>(
    getSupabaseMissingVariables(configuration?.state ?? "configured")
  );
  const isMountedRef = useRef(true);

  const updateFromSession = useCallback((session: Session | null) => {
    const sessionUser = session?.user ?? null;

    setUser(sessionUser);
    setIdentity(sessionUser && isAdministratorUser(sessionUser) ? createSupabaseAdminIdentity(sessionUser) : null);
    setStatus(getStatusForUser(sessionUser));
  }, []);

  const refreshSession = useCallback(async () => {
    if (import.meta.env.DEV && authenticationMode === "local-dev") {
      if (!isMountedRef.current) {
        return;
      }

      setStatus("loading");
      const { getLocalAdminSession } = await import("../services/local-admin-auth.client");
      const snapshot = await getLocalAdminSession();

      if (!isMountedRef.current) {
        return;
      }

      setUser(null);

      if (!snapshot.ok) {
        setIdentity(null);
        setStatus("error");
        return;
      }

      if (snapshot.data.authenticated) {
        setConfigurationState("configured");
        setMissingConfigurationVariables([]);
        setIdentity(snapshot.data.user);
        setStatus("authenticated_admin");
        return;
      }

      setIdentity(null);

      if (snapshot.data.configurationState && snapshot.data.configurationState !== "configured") {
        setConfigurationState(snapshot.data.configurationState);
        setMissingConfigurationVariables(snapshot.data.missingVariables ?? []);
        setStatus("configuration_missing");
        return;
      }

      setConfigurationState("configured");
      setMissingConfigurationVariables([]);
      setStatus("unauthenticated");
      return;
    }

    const currentConfiguration = getSupabaseConfiguration();

    if (!isMountedRef.current) {
      return;
    }

    setConfigurationState(currentConfiguration.state);
    setMissingConfigurationVariables(getSupabaseMissingVariables(currentConfiguration.state));

    if (currentConfiguration.state !== "configured") {
      setUser(null);
      setIdentity(null);
      setStatus("configuration_missing");
      return;
    }

    setStatus("loading");
    const snapshot = await restoreAdminSession();

    if (!isMountedRef.current) {
      return;
    }

    if (snapshot.status === "configuration_missing") {
      setUser(null);
      setIdentity(null);
      setStatus("configuration_missing");
      return;
    }

    if (snapshot.status === "error") {
      setUser(null);
      setIdentity(null);
      setStatus("error");
      return;
    }

    setUser(snapshot.user);
    setIdentity(snapshot.user && snapshot.isAdmin ? createSupabaseAdminIdentity(snapshot.user) : null);
    setStatus(getStatusForUser(snapshot.user));
  }, [authenticationMode]);

  useEffect(() => {
    isMountedRef.current = true;
    void refreshSession();

    if (authenticationMode === "local-dev") {
      return () => {
        isMountedRef.current = false;
      };
    }

    const client = getConfiguredSupabaseClient();

    if (!client) {
      return () => {
        isMountedRef.current = false;
      };
    }

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!isMountedRef.current) {
        return;
      }

      updateFromSession(session);
    });

    return () => {
      isMountedRef.current = false;
      data.subscription.unsubscribe();
    };
  }, [authenticationMode, refreshSession, updateFromSession]);

  const signIn = useCallback(async (email: string, password: string): Promise<AdminSignInResult> => {
    if (import.meta.env.DEV && authenticationMode === "local-dev") {
      const { localAdminSignIn } = await import("../services/local-admin-auth.client");
      const result = await localAdminSignIn(email, password);

      if (!isMountedRef.current) {
        return result.ok && result.data.authenticated
          ? {
              identity: result.data.user,
              ok: true,
              user: null
            }
          : {
              ok: false,
              reason: "error"
            };
      }

      setUser(null);

      if (!result.ok) {
        setIdentity(null);

        if (result.code === "CONFIGURATION_REQUIRED") {
          setConfigurationState("missing_email");
          setMissingConfigurationVariables(result.missingVariables ?? []);
          setStatus("configuration_missing");

          const configurationFailure: AdminSignInResult = {
            ok: false,
            reason: "configuration_missing"
          };

          if (result.missingVariables) {
            configurationFailure.missingVariables = result.missingVariables;
          }

          return configurationFailure;
        }

        setStatus("unauthenticated");

        return {
          ok: false,
          reason: result.code === "INVALID_CREDENTIALS" ? "invalid_credentials" : "error"
        };
      }

      if (!result.data.authenticated) {
        setIdentity(null);
        setStatus("unauthenticated");

        return {
          ok: false,
          reason: "invalid_credentials"
        };
      }

      setConfigurationState("configured");
      setMissingConfigurationVariables([]);
      setIdentity(result.data.user);
      setStatus("authenticated_admin");

      return {
        identity: result.data.user,
        ok: true,
        user: null
      };
    }

    const result = await signInAdministrator(email, password);

    if (!isMountedRef.current) {
      return result;
    }

    if (!result.ok) {
      if (result.reason === "configuration_missing") {
        setUser(null);
        setIdentity(null);
        setStatus("configuration_missing");
      } else if (result.reason === "not_admin") {
        setUser(null);
        setIdentity(null);
        setStatus("authenticated_non_admin");
      } else {
        setUser(null);
        setIdentity(null);
        setStatus("unauthenticated");
      }

      return result;
    }

    setUser(result.user);
    setIdentity(result.identity);
    setStatus("authenticated_admin");

    return result;
  }, [authenticationMode]);

  const signOut = useCallback(async () => {
    try {
      if (import.meta.env.DEV && authenticationMode === "local-dev") {
        const { localAdminSignOut } = await import("../services/local-admin-auth.client");
        await localAdminSignOut();
      } else {
        await signOutAdministrator();
      }
    } finally {
      if (isMountedRef.current) {
        setUser(null);
        setIdentity(null);
        setStatus("unauthenticated");
      }
    }
  }, [authenticationMode]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      authenticationMode,
      configurationState,
      identity,
      isAdmin: status === "authenticated_admin",
      missingConfigurationVariables,
      refreshSession,
      signIn,
      signOut,
      status,
      user
    }),
    [
      authenticationMode,
      configurationState,
      identity,
      missingConfigurationVariables,
      refreshSession,
      signIn,
      signOut,
      status,
      user
    ]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
