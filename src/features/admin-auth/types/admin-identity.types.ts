export type AdminAuthenticationMode = "supabase" | "local-dev";

export type AdminIdentity = {
  email: string;
  displayName?: string;
  role: "admin";
  authenticationMode: AdminAuthenticationMode;
};

export type LocalAdminConfigurationState =
  | "configured"
  | "missing_email"
  | "missing_password_hash"
  | "missing_session_secret"
  | "invalid_password_hash"
  | "invalid_session_secret"
  | "disabled";
