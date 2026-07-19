import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import type { AdminAuthContextValue } from "../../features/admin-auth/types/admin-auth.types";
import { AdminLoginPage } from "./AdminLoginPage";

const mockUseAdminAuth = vi.fn<() => AdminAuthContextValue>();

vi.mock("../../features/admin-auth/hooks/useAdminAuth", () => ({
  useAdminAuth: () => mockUseAdminAuth()
}));

function createAuth(overrides: Partial<AdminAuthContextValue> = {}): AdminAuthContextValue {
  return {
    authenticationMode: "supabase",
    configurationState: "configured",
    identity: null,
    isAdmin: false,
    missingConfigurationVariables: [],
    refreshSession: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    status: "unauthenticated",
    user: null,
    ...overrides
  };
}

function LocationProbe() {
  const location = useLocation();

  return <output data-testid="location">{location.pathname}</output>;
}

function renderLoginPage(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/admin/login", state }]}>
      <Routes>
        <Route element={<AdminLoginPage />} path="/admin/login" />
        <Route element={<><h1>Dashboard</h1><LocationProbe /></>} path="/admin/dashboard" />
        <Route element={<><h1>Payment Settings</h1><LocationProbe /></>} path="/admin/payment-settings" />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminLoginPage", () => {
  afterEach(() => {
    mockUseAdminAuth.mockReset();
  });

  it("shows configuration-required state when Supabase config is missing", () => {
    mockUseAdminAuth.mockReturnValue(createAuth({ status: "configuration_missing" }));

    renderLoginPage();

    expect(screen.getByText("प्रशासन लॉगिन कॉन्फ़िगरेशन आवश्यक है")).toBeInTheDocument();
  });

  it("redirects successful administrator login to the safe requested admin path", async () => {
    const user = userEvent.setup();
    const signIn = vi.fn().mockResolvedValue({
      identity: {
        authenticationMode: "supabase",
        email: "admin@example.test",
        role: "admin"
      },
      ok: true,
      user: {
        app_metadata: {
          role: "admin"
        }
      }
    });
    mockUseAdminAuth.mockReturnValue(createAuth({ signIn }));

    renderLoginPage({ from: "/admin/payment-settings" });

    await user.type(screen.getByLabelText(/ईमेल पता/), "admin@example.test");
    await user.type(screen.getByPlaceholderText("पासवर्ड दर्ज करें"), "password");
    await user.click(screen.getByRole("button", { name: "लॉगिन करें" }));

    expect(await screen.findByText("Payment Settings")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/admin/payment-settings");
  });

  it("falls back to dashboard for unsafe requested redirects", async () => {
    const user = userEvent.setup();
    const signIn = vi.fn().mockResolvedValue({
      identity: {
        authenticationMode: "supabase",
        email: "admin@example.test",
        role: "admin"
      },
      ok: true,
      user: {
        app_metadata: {
          role: "admin"
        }
      }
    });
    mockUseAdminAuth.mockReturnValue(createAuth({ signIn }));

    renderLoginPage({ from: "https://example.com" });

    await user.type(screen.getByLabelText(/ईमेल पता/), "admin@example.test");
    await user.type(screen.getByPlaceholderText("पासवर्ड दर्ज करें"), "password");
    await user.click(screen.getByRole("button", { name: "लॉगिन करें" }));

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/admin/dashboard");
  });

  it("shows access denied for authenticated non-administrator state", () => {
    mockUseAdminAuth.mockReturnValue(createAuth({ status: "authenticated_non_admin" }));

    renderLoginPage();

    expect(screen.getByRole("alert")).toHaveTextContent("प्रशासनिक पहुंच उपलब्ध नहीं है");
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("shows the local development notice only in local-dev mode", () => {
    mockUseAdminAuth.mockReturnValue(createAuth({ authenticationMode: "local-dev" }));

    renderLoginPage();

    expect(screen.getByText("स्थानीय विकास लॉगिन")).toBeInTheDocument();
    expect(
      screen.getByText(
        "यह लॉगिन केवल स्थानीय UI परीक्षण के लिए सक्रिय है। उत्पादन वातावरण में Supabase प्रशासन प्रमाणीकरण का उपयोग किया जाएगा।"
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("DEV_ADMIN_PASSWORD_HASH")).not.toBeInTheDocument();
  });
});
