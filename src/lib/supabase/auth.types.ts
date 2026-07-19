export type SupabaseConfigurationState =
  | "configured"
  | "missing_url"
  | "missing_anon_key"
  | "invalid";

export type SupabaseConfiguration = {
  state: SupabaseConfigurationState;
  url: string | null;
  anonKey: string | null;
};
