import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfiguration } from "./configuration";
import type { Database } from "./database.types";

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  const configuration = getSupabaseConfiguration();

  if (configuration.state !== "configured" || !configuration.url || !configuration.anonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient<Database>(configuration.url, configuration.anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    });
  }

  return browserClient;
}

export function resetSupabaseClientForTests(): void {
  if (import.meta.env.MODE === "test") {
    browserClient = null;
  }
}
