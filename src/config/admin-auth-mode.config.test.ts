import { describe, expect, it } from "vitest";
import { resolveAdminAuthenticationMode } from "./admin-auth-mode.config";

describe("admin auth mode configuration", () => {
  it("uses Supabase mode by default", () => {
    expect(
      resolveAdminAuthenticationMode({
        isDevelopment: true,
        requestedMode: undefined
      })
    ).toBe("supabase");
  });

  it("activates local-dev mode only during development", () => {
    expect(
      resolveAdminAuthenticationMode({
        isDevelopment: true,
        requestedMode: "local-dev"
      })
    ).toBe("local-dev");
  });

  it("rejects local-dev mode in production builds", () => {
    expect(
      resolveAdminAuthenticationMode({
        isDevelopment: false,
        requestedMode: "local-dev"
      })
    ).toBe("supabase");
  });
});
