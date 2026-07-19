import { afterEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  signInAdministrator,
  signOutAdministrator
} from "./admin-auth.service";

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn()
}));

vi.mock("../../../lib/supabase/client", () => ({
  getSupabaseClient: mocks.getSupabaseClient
}));

function createUser(role: string) {
  return {
    app_metadata: {
      role
    },
    email: "admin@example.test"
  } as User;
}

describe("admin-auth service", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("signs in an administrator using Supabase Auth", async () => {
    const user = createUser("admin");
    mocks.signInWithPassword.mockResolvedValue({
      data: {
        user
      },
      error: null
    });
    mocks.getSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: mocks.signInWithPassword
      }
    });

    const result = await signInAdministrator("admin@example.test", "password");

    expect(result).toEqual({
      identity: {
        authenticationMode: "supabase",
        email: "admin@example.test",
        role: "admin"
      },
      ok: true,
      user
    });
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@example.test",
      password: "password"
    });
  });

  it("denies authenticated non-administrators", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: {
        user: createUser("member")
      },
      error: null
    });
    mocks.getSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: mocks.signInWithPassword
      }
    });

    await expect(signInAdministrator("member@example.test", "password")).resolves.toEqual({
      ok: false,
      reason: "not_admin"
    });
  });

  it("returns a generic invalid-credentials reason for failed login", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: {
        user: null
      },
      error: new Error("Raw Supabase error")
    });
    mocks.getSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: mocks.signInWithPassword
      }
    });

    await expect(signInAdministrator("admin@example.test", "password")).resolves.toEqual({
      ok: false,
      reason: "invalid_credentials"
    });
  });

  it("calls Supabase signOut for logout", async () => {
    mocks.signOut.mockResolvedValue({
      error: null
    });
    mocks.getSupabaseClient.mockReturnValue({
      auth: {
        signOut: mocks.signOut
      }
    });

    await signOutAdministrator();

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });
});
