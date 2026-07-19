// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { IncomingMessage, ServerResponse } from "node:http";

export type AdminAuthenticationMode = "supabase" | "local-dev";

export type LocalAdminConfigurationState =
  | "configured"
  | "missing_email"
  | "missing_password_hash"
  | "missing_session_secret"
  | "invalid_password_hash"
  | "invalid_session_secret"
  | "disabled";

export type LocalAdminUser = {
  email: string;
  displayName?: string;
  role: "admin";
  authenticationMode: "local-dev";
};

export type LocalAdminSessionPayload = LocalAdminUser & {
  issuedAt: number;
  expiresAt: number;
};

export type LocalAdminAuthConfig =
  | {
      state: "configured";
      adminName?: string;
      adminEmail: string;
      passwordHash: string;
      sessionSecret: string;
      sessionTtlSeconds: number;
      allowLan: boolean;
    }
  | {
      state: Exclude<LocalAdminConfigurationState, "configured">;
      missingVariables: string[];
      allowLan: boolean;
      sessionTtlSeconds: number;
    };

export type LocalAdminAuthMiddleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void
) => void;
