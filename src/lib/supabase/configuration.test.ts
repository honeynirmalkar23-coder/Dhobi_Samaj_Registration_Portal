import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseConfiguration, isSupabaseConfigured } from "./configuration";
import { getSupabaseClient, resetSupabaseClientForTests } from "./client";

describe("Supabase configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetSupabaseClientForTests();
  });

  it("returns missing configuration safely without creating a client", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    expect(getSupabaseConfiguration().state).toBe("missing_url");
    expect(isSupabaseConfigured()).toBe(false);
    expect(getSupabaseClient()).toBeNull();
  });

  it("detects missing anonymous key", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    expect(getSupabaseConfiguration().state).toBe("missing_anon_key");
  });

  it("detects invalid URL", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "not-a-url");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");

    expect(getSupabaseConfiguration().state).toBe("invalid");
  });
});
