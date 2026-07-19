import type { User } from "@supabase/supabase-js";
import type { SupabaseConfigurationState } from "../../../lib/supabase/auth.types";
import type {
  AdminAuthenticationMode,
  AdminIdentity,
  LocalAdminConfigurationState
} from "./admin-identity.types";

export type AdminConfigurationState = SupabaseConfigurationState | LocalAdminConfigurationState;

export type AdminAuthStatus =
  | "configuration_missing"
  | "loading"
  | "unauthenticated"
  | "authenticated_admin"
  | "authenticated_non_admin"
  | "error";

export type AdminSignInResult =
  | {
      ok: true;
      identity: AdminIdentity;
      user: User | null;
    }
  | {
      ok: false;
      reason: "configuration_missing" | "invalid_credentials" | "not_admin" | "error";
      missingVariables?: string[];
    };

export type AdminAuthContextValue = {
  authenticationMode: AdminAuthenticationMode;
  configurationState: AdminConfigurationState;
  identity: AdminIdentity | null;
  missingConfigurationVariables: string[];
  status: AdminAuthStatus;
  user: User | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<AdminSignInResult>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};
