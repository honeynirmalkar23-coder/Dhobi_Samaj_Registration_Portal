import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import type { AdminAuthContextValue, AdminAuthStatus } from "../../features/admin-auth/types/admin-auth.types";
import { AdminRoute } from "./AdminRoute";

const mockUseAdminAuth = vi.fn<() => AdminAuthContextValue>();

vi.mock("../../features/admin-auth/hooks/useAdminAuth", () => ({
  useAdminAuth: () => mockUseAdminAuth()
}));

function createAuth(status: AdminAuthStatus): AdminAuthContextValue {
  return {
    authenticationMode: "supabase",
    configurationState: status === "configuration_missing" ? "missing_url" : "configured",
    identity: null,
    isAdmin: status === "authenticated_admin",
    missingConfigurationVariables: status === "configuration_missing" ? ["VITE_SUPABASE_URL"] : [],
    refreshSession: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    status,
    user: null
  };
}

function LoginProbe() {
  const location = useLocation();

  return (
    <>
      <p>Login Page</p>
      <output data-testid="redirect-from">
        {String((location.state as { from?: string } | null)?.from ?? "")}
      </output>
    </>
  );
}

function renderAdminRoute(status: AdminAuthStatus) {
  mockUseAdminAuth.mockReturnValue(createAuth(status));

  return render(
    <MemoryRouter initialEntries={["/admin/payment-settings?tab=test"]}>
      <Routes>
        <Route
          element={
            <AdminRoute>
              <h1>Protected Admin Content</h1>
            </AdminRoute>
          }
          path="/admin/payment-settings"
        />
        <Route element={<LoginProbe />} path="/admin/login" />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminRoute", () => {
  beforeEach(() => {
    mockUseAdminAuth.mockReset();
  });

  it("shows loading without flashing protected content", () => {
    renderAdminRoute("loading");

    expect(screen.getByRole("status")).toHaveTextContent("प्रशासन सत्र जांचा जा रहा है…");
    expect(screen.queryByText("Protected Admin Content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users and preserves the requested admin path", () => {
    renderAdminRoute("unauthenticated");

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.getByTestId("redirect-from")).toHaveTextContent(
      "/admin/payment-settings?tab=test"
    );
  });

  it("renders protected content for authenticated administrators", () => {
    const user = {
      app_metadata: {
        role: "admin"
      }
    } as User;

    mockUseAdminAuth.mockReturnValue({
      ...createAuth("authenticated_admin"),
      user
    });

    render(
      <MemoryRouter initialEntries={["/admin/payment-settings"]}>
        <AdminRoute>
          <h1>Protected Admin Content</h1>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Admin Content")).toBeInTheDocument();
  });

  it("denies authenticated non-administrators", () => {
    renderAdminRoute("authenticated_non_admin");

    expect(screen.getByRole("alert")).toHaveTextContent("प्रशासनिक पहुंच उपलब्ध नहीं है");
    expect(screen.queryByText("Protected Admin Content")).not.toBeInTheDocument();
  });

  it("shows configuration-required state when Supabase is missing", () => {
    renderAdminRoute("configuration_missing");

    expect(screen.getByText("प्रशासन लॉगिन कॉन्फ़िगरेशन आवश्यक है")).toBeInTheDocument();
    expect(screen.getByText("VITE_SUPABASE_URL")).toBeInTheDocument();
    expect(screen.getByText("VITE_SUPABASE_ANON_KEY")).toBeInTheDocument();
  });
});
