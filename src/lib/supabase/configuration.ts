import type { SupabaseConfiguration } from "./auth.types";

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function getSupabaseConfiguration(): SupabaseConfiguration {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url) {
    return {
      anonKey: anonKey || null,
      state: "missing_url",
      url: null
    };
  }

  if (!anonKey) {
    return {
      anonKey: null,
      state: "missing_anon_key",
      url
    };
  }

  if (!isValidHttpUrl(url)) {
    return {
      anonKey,
      state: "invalid",
      url
    };
  }

  return {
    anonKey,
    state: "configured",
    url
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfiguration().state === "configured";
}
