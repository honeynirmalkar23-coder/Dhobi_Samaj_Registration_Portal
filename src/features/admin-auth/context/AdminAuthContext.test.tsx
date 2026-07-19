import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session, User } from "@supabase/supabase-js";
import { AdminAuthProvider } from "./AdminAuthContext";
import { useAdminAuth } from "../hooks/useAdminAuth";

const adminUser = {
  app_metadata: {
    role: "admin"
  },
  email: "admin@example.test"
} as User;

const mocks = vi.hoisted(() => ({
  authStateCallback: null as null | ((_event: string, session: Session | null) => void),
  getConfiguredSupabaseClient: vi.fn(),
  getLocalAdminSession: vi.fn(),
  restoreAdminSession: vi.fn(),
  localAdminSignIn: vi.fn(),
  localAdminSignOut: vi.fn(),
  signInAdministrator: vi.fn(),
  signOutAdministrator: vi.fn(),
  unsubscribe: vi.fn()
}));

vi.mock("../services/admin-auth.service", () => ({
  createSupabaseAdminIdentity: (user: User) => ({
    authenticationMode: "supabase",
    email: user.email ?? "admin",
    role: "admin"
  }),
  getConfiguredSupabaseClient: mocks.getConfiguredSupabaseClient,
  restoreAdminSession: mocks.restoreAdminSession,
  signInAdministrator: mocks.signInAdministrator,
  signOutAdministrator: mocks.signOutAdministrator
}));

vi.mock("../services/local-admin-auth.client", () => ({
  getLocalAdminSession: mocks.getLocalAdminSession,
  localAdminSignIn: mocks.localAdminSignIn,
  localAdminSignOut: mocks.localAdminSignOut
}));

function AuthProbe() {
  const { identity, signOut, status, user } = useAdminAuth();

  return (
    <>
      <output data-testid="auth-status">{status}</output>
      <output data-testid="auth-email">{identity?.email ?? user?.email ?? ""}</output>
      <button onClick={() => void signOut()} type="button">logout</button>
    </>
  );
}

function renderProvider() {
  return render(
    <AdminAuthProvider>
      <AuthProbe />
    </AdminAuthProvider>
  );
}

describe("AdminAuthProvider", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ADMIN_AUTH_MODE", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    mocks.authStateCallback = null;
    mocks.getLocalAdminSession.mockReset();
    mocks.localAdminSignIn.mockReset();
    mocks.localAdminSignOut.mockReset();
    mocks.unsubscribe.mockReset();
    mocks.getConfiguredSupabaseClient.mockReturnValue({
      auth: {
        onAuthStateChange: vi.fn((callback) => {
          mocks.authStateCallback = callback;

          return {
            data: {
              subscription: {
                unsubscribe: mocks.unsubscribe
              }
            }
          };
        })
      }
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("restores an existing administrator session", async () => {
    mocks.restoreAdminSession.mockResolvedValue({
      isAdmin: true,
      session: {
        user: adminUser
      },
      status: "configured",
      user: adminUser
    });

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated_admin")
    );
    expect(screen.getByTestId("auth-email")).toHaveTextContent("admin@example.test");
  });

  it("removes protected authentication state on session expiry", async () => {
    mocks.restoreAdminSession.mockResolvedValue({
      isAdmin: true,
      session: {
        user: adminUser
      },
      status: "configured",
      user: adminUser
    });

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated_admin")
    );

    act(() => {
      mocks.authStateCallback?.("SIGNED_OUT", null);
    });

    expect(screen.getByTestId("auth-status")).toHaveTextContent("unauthenticated");
  });

  it("calls Supabase signOut and clears administrator state", async () => {
    const user = userEvent.setup();
    mocks.restoreAdminSession.mockResolvedValue({
      isAdmin: true,
      session: {
        user: adminUser
      },
      status: "configured",
      user: adminUser
    });
    mocks.signOutAdministrator.mockResolvedValue(undefined);

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated_admin")
    );
    await user.click(screen.getByRole("button", { name: "logout" }));

    expect(mocks.signOutAdministrator).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("auth-status")).toHaveTextContent("unauthenticated");
  });

  it("restores and logs out a local development administrator session without a Supabase user", async () => {
    const user = userEvent.setup();
    vi.stubEnv("VITE_ADMIN_AUTH_MODE", "local-dev");
    mocks.getLocalAdminSession.mockResolvedValue({
      data: {
        authenticated: true,
        user: {
          authenticationMode: "local-dev",
          email: "local-admin@example.test",
          role: "admin"
        }
      },
      ok: true
    });
    mocks.localAdminSignOut.mockResolvedValue({
      data: {},
      ok: true
    });

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("auth-status")).toHaveTextContent("authenticated_admin")
    );
    expect(screen.getByTestId("auth-email")).toHaveTextContent("local-admin@example.test");
    expect(mocks.getConfiguredSupabaseClient).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "logout" }));

    expect(mocks.localAdminSignOut).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("auth-status")).toHaveTextContent("unauthenticated");
  });

  it("shows configuration_missing for incomplete local development authentication settings", async () => {
    vi.stubEnv("VITE_ADMIN_AUTH_MODE", "local-dev");
    mocks.getLocalAdminSession.mockResolvedValue({
      data: {
        authenticated: false,
        configurationState: "missing_password_hash",
        missingVariables: ["DEV_ADMIN_PASSWORD_HASH"],
        user: null
      },
      ok: true
    });

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("auth-status")).toHaveTextContent("configuration_missing")
    );
    expect(screen.getByTestId("auth-email")).toHaveTextContent("");
  });
});
