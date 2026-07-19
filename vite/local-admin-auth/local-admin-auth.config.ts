// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { LocalAdminAuthConfig } from "./local-admin-auth.types";

const defaultTtlMinutes = 480;
const minimumSessionSecretLength = 32;
const bcryptCost12Pattern = /^\$2[aby]\$12\$[./A-Za-z0-9]{53}$/;

function normalizeEmail(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeName(value: string | undefined): string {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function parseBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function parseTtlSeconds(value: string | undefined): number {
  const parsedValue = Number(value ?? defaultTtlMinutes);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return defaultTtlMinutes * 60;
  }

  return Math.min(Math.floor(parsedValue), 24 * 60) * 60;
}

export function createLocalAdminAuthConfig(env: Record<string, string | undefined>): LocalAdminAuthConfig {
  const adminName = normalizeName(env.DEV_ADMIN_NAME);
  const adminEmail = normalizeEmail(env.DEV_ADMIN_EMAIL);
  const passwordHash = env.DEV_ADMIN_PASSWORD_HASH?.trim() ?? "";
  const sessionSecret = env.DEV_ADMIN_SESSION_SECRET?.trim() ?? "";
  const allowLan = parseBoolean(env.DEV_ADMIN_ALLOW_LAN);
  const sessionTtlSeconds = parseTtlSeconds(env.DEV_ADMIN_SESSION_TTL_MINUTES);

  if (!adminEmail) {
    return {
      allowLan,
      missingVariables: ["DEV_ADMIN_EMAIL"],
      sessionTtlSeconds,
      state: "missing_email"
    };
  }

  if (!passwordHash) {
    return {
      allowLan,
      missingVariables: ["DEV_ADMIN_PASSWORD_HASH"],
      sessionTtlSeconds,
      state: "missing_password_hash"
    };
  }

  if (!bcryptCost12Pattern.test(passwordHash)) {
    return {
      allowLan,
      missingVariables: ["DEV_ADMIN_PASSWORD_HASH"],
      sessionTtlSeconds,
      state: "invalid_password_hash"
    };
  }

  if (!sessionSecret) {
    return {
      allowLan,
      missingVariables: ["DEV_ADMIN_SESSION_SECRET"],
      sessionTtlSeconds,
      state: "missing_session_secret"
    };
  }

  if (sessionSecret.length < minimumSessionSecretLength) {
    return {
      allowLan,
      missingVariables: ["DEV_ADMIN_SESSION_SECRET"],
      sessionTtlSeconds,
      state: "invalid_session_secret"
    };
  }

  const configured = {
    adminEmail,
    allowLan,
    passwordHash,
    sessionSecret,
    sessionTtlSeconds,
    state: "configured"
  } as const;

  return adminName ? { ...configured, adminName } : configured;
}
