import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../../lib/supabase/client";
import { getSupabaseConfiguration } from "../../../lib/supabase/configuration";
import type { AdminSignInResult } from "../types/admin-auth.types";
import { isAdministratorUser } from "../utilities/admin-role";
import type { AdminIdentity } from "../types/admin-identity.types";

export type AdminSessionSnapshot =
  | {
      status: "configured";
      session: Session | null;
      user: User | null;
      isAdmin: boolean;
    }
  | {
      status: "configuration_missing" | "error";
      session: null;
      user: null;
      isAdmin: false;
    };

function readUserMetadataString(user: User, keys: string[]): string {
  const metadata = user.user_metadata ?? {};

  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

export function createSupabaseAdminIdentity(user: User): AdminIdentity {
  const displayName = readUserMetadataString(user, ["display_name", "full_name", "name"]);

  return {
    authenticationMode: "supabase",
    ...(displayName ? { displayName } : {}),
    email: user.email ?? "admin",
    role: "admin"
  };
}

export function getConfiguredSupabaseClient(): SupabaseClient | null {
  return getSupabaseClient();
}

export async function restoreAdminSession(): Promise<AdminSessionSnapshot> {
  const configuration = getSupabaseConfiguration();

  if (configuration.state !== "configured") {
    return {
      isAdmin: false,
      session: null,
      status: "configuration_missing",
      user: null
    };
  }

  const client = getConfiguredSupabaseClient();

  if (!client) {
    return {
      isAdmin: false,
      session: null,
      status: "configuration_missing",
      user: null
    };
  }

  const { data, error } = await client.auth.getSession();

  if (error) {
    return {
      isAdmin: false,
      session: null,
      status: "error",
      user: null
    };
  }

  const session = data.session ?? null;
  const user = session?.user ?? null;

  return {
    isAdmin: isAdministratorUser(user),
    session,
    status: "configured",
    user
  };
}

export async function signInAdministrator(
  email: string,
  password: string
): Promise<AdminSignInResult> {
  const client = getConfiguredSupabaseClient();

  if (!client) {
    return {
      ok: false,
      reason: "configuration_missing"
    };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user) {
    return {
      ok: false,
      reason: "invalid_credentials"
    };
  }

  if (!isAdministratorUser(data.user)) {
    return {
      ok: false,
      reason: "not_admin"
    };
  }

  return {
    identity: createSupabaseAdminIdentity(data.user),
    ok: true,
    user: data.user
  };
}

export async function signOutAdministrator(): Promise<void> {
  const client = getConfiguredSupabaseClient();

  if (!client) {
    return;
  }

  const { error } = await client.auth.signOut();

  if (error) {
    throw new Error("ADMIN_SIGN_OUT_FAILED");
  }
}
