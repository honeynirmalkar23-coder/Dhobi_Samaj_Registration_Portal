import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminAuthContextValue, AdminAuthStatus } from "../../features/admin-auth/types/admin-auth.types";
import { AdminRoute } from "../../app/route-guards/AdminRoute";
import { AdminPaymentSettingsPage } from "./AdminPaymentSettingsPage";

const mockUseAdminAuth = vi.fn<() => AdminAuthContextValue>();
const paymentSettingsServiceMocks = vi.hoisted(() => ({
  loadAdminPaymentSettings: vi.fn(),
  saveAdminPaymentSettings: vi.fn()
}));

vi.mock("../../features/admin-auth/hooks/useAdminAuth", () => ({
  useAdminAuth: () => mockUseAdminAuth()
}));

vi.mock("../../services/payment-settings.service", () => paymentSettingsServiceMocks);

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

function renderProtectedPaymentSettings(status: AdminAuthStatus) {
  mockUseAdminAuth.mockReturnValue(createAuth(status));

  return render(
    <MemoryRouter initialEntries={["/admin/payment-settings"]}>
      <Routes>
        <Route
          element={
            <AdminRoute>
              <AdminPaymentSettingsPage />
            </AdminRoute>
          }
          path="/admin/payment-settings"
        />
        <Route element={<LoginProbe />} path="/admin/login" />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminPaymentSettingsPage protection", () => {
  beforeEach(() => {
    mockUseAdminAuth.mockReset();
    paymentSettingsServiceMocks.loadAdminPaymentSettings.mockReset();
    paymentSettingsServiceMocks.saveAdminPaymentSettings.mockReset();
    paymentSettingsServiceMocks.loadAdminPaymentSettings.mockResolvedValue({
      ok: true,
      data: {
        amount: null,
        instructions: null,
        payeeName: null,
        paymentDeadline: null,
        paymentEnabled: false,
        paymentTitle: null,
        publicContact: null,
        qrCodePath: null,
        qrCodeSignedUrl: null,
        updatedAt: "2026-07-16T00:00:00.000Z",
        upiId: null
      }
    });
  });

  it("redirects unauthenticated users away from payment settings", () => {
    renderProtectedPaymentSettings("unauthenticated");

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.getByTestId("redirect-from")).toHaveTextContent("/admin/payment-settings");
    expect(screen.queryByRole("heading", { level: 1, name: "भुगतान सेटिंग्स" })).not.toBeInTheDocument();
  });

  it("denies authenticated non-administrators", () => {
    renderProtectedPaymentSettings("authenticated_non_admin");

    expect(screen.getByRole("alert")).toHaveTextContent("प्रशासनिक पहुंच उपलब्ध नहीं है");
    expect(screen.queryByRole("heading", { level: 1, name: "भुगतान सेटिंग्स" })).not.toBeInTheDocument();
  });

  it("renders payment settings for authenticated administrators", async () => {
    renderProtectedPaymentSettings("authenticated_admin");

    expect(screen.getByRole("heading", { level: 1, name: "भुगतान सेटिंग्स" })).toBeInTheDocument();
    expect(await screen.findByText("ऑनलाइन भुगतान की उपलब्धता")).toBeInTheDocument();
  });
});
