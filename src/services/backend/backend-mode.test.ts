import { describe, expect, it } from "vitest";
import { resolveDataBackendMode } from "./backend-mode";

describe("data backend mode", () => {
  it("uses Supabase by default", () => {
    expect(
      resolveDataBackendMode({
        isDevelopment: true,
        requestedMode: undefined
      })
    ).toBe("supabase");
  });

  it("enables local data backend only during development", () => {
    expect(
      resolveDataBackendMode({
        isDevelopment: true,
        requestedMode: "local-dev"
      })
    ).toBe("local-dev");
  });

  it("rejects local data backend mode in production", () => {
    expect(
      resolveDataBackendMode({
        isDevelopment: false,
        requestedMode: "local-dev"
      })
    ).toBe("supabase");
  });
});

