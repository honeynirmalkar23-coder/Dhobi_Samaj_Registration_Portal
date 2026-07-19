import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminAuditLogsPage } from "./AdminAuditLogsPage";
import { AdminPaymentSettingsPage } from "./AdminPaymentSettingsPage";
import { AdminProfilePage } from "./AdminProfilePage";
import { AdminRegistrationDetailsPage } from "./AdminRegistrationDetailsPage";

const adminRegistrationServiceMocks = vi.hoisted(() => ({
  loadAdminRegistrationDetails: vi.fn(),
  runAdminRegistrationAction: vi.fn(),
  updateAdminNotes: vi.fn()
}));

const paymentSettingsServiceMocks = vi.hoisted(() => ({
  loadAdminPaymentSettings: vi.fn(),
  saveAdminPaymentSettings: vi.fn()
}));

const adminAuditServiceMocks = vi.hoisted(() => ({
  loadAdminAuditLogs: vi.fn()
}));

const adminProfileServiceMocks = vi.hoisted(() => ({
  loadAdminProfile: vi.fn(),
  saveAdminProfile: vi.fn()
}));

const adminAuthMocks = vi.hoisted(() => ({
  identity: {
    authenticationMode: "supabase",
    displayName: "Portal Admin",
    email: "admin@example.test",
    role: "admin"
  },
  refreshSession: vi.fn()
}));

vi.mock("../../services/admin-registration.service", () => adminRegistrationServiceMocks);
vi.mock("../../services/payment-settings.service", () => paymentSettingsServiceMocks);
vi.mock("../../services/admin-audit.service", () => adminAuditServiceMocks);
vi.mock("../../services/admin-profile.service", () => adminProfileServiceMocks);
vi.mock("../../features/admin-auth/hooks/useAdminAuth", () => ({
  useAdminAuth: () => ({
    identity: adminAuthMocks.identity,
    refreshSession: adminAuthMocks.refreshSession
  })
}));
vi.mock("../../services/backend/backend-mode", () => ({
  dataBackendMode: "local-dev",
  getDataBackendMode: () => "local-dev",
  resolveDataBackendMode: ({ isDevelopment, requestedMode }: {
    isDevelopment: boolean;
    requestedMode: string | undefined;
  }) => (isDevelopment && requestedMode === "local-dev" ? "local-dev" : "supabase")
}));

function renderAdminDetails(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AdminRegistrationDetailsPage />} path="/admin/registrations/:registrationId" />
      </Routes>
    </MemoryRouter>
  );
}

describe("admin backend-connected routes", () => {
  beforeEach(() => {
    adminRegistrationServiceMocks.loadAdminRegistrationDetails.mockReset();
    adminRegistrationServiceMocks.runAdminRegistrationAction.mockReset();
    adminRegistrationServiceMocks.updateAdminNotes.mockReset();
    adminRegistrationServiceMocks.loadAdminRegistrationDetails.mockResolvedValue({
      ok: true,
      data: {
        adminNotes: null,
        age: 35,
        applicantPhotoPath: "applicant-photos/DS-2026-000001/photo.jpg",
        applicantPhotoSignedUrl: "https://signed.example/applicant-photo.jpg",
        approvedAt: null,
        archivedAt: null,
        boysCount: 2,
        createdAt: "2026-07-15T00:00:00.000Z",
        educationDetails: "बी.ए.",
        educationLevel: "graduate",
        eldersCount: 1,
        fullName: "सीता देवी",
        girlsCount: 3,
        paymentProofs: [],
        paymentResubmissionAllowed: false,
        paymentStatus: "pending_verification",
        paymentSubmittedAt: null,
        paymentVerifiedAt: null,
        permanentAddress: "ग्राम उदाहरण",
        publicRejectionMessage: null,
        registrationId: "DS-2026-000001",
        registrationStatus: "under_review",
        rejectedAt: null,
        reviewedAt: null,
        totalFamilyMembers: 6,
        updatedAt: "2026-07-16T00:00:00.000Z",
        version: 1
      }
    });
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
        upiId: null,
        dataSource: "local-dev",
        localTestingBadge: "स्थानीय परीक्षण डेटा"
      }
    });
    adminAuditServiceMocks.loadAdminAuditLogs.mockReset();
    adminAuditServiceMocks.loadAdminAuditLogs.mockResolvedValue({
      ok: true,
      data: {
        rows: [],
        totalItems: 0,
        totalPages: 1
      }
    });
    adminProfileServiceMocks.loadAdminProfile.mockReset();
    adminProfileServiceMocks.saveAdminProfile.mockReset();
    adminProfileServiceMocks.loadAdminProfile.mockResolvedValue({
      ok: true,
      data: {
        authenticationMode: "supabase",
        displayName: "Portal Admin",
        email: "admin@example.test",
        identity: adminAuthMocks.identity
      }
    });
  });

  it("loads valid registration details without placeholder records", async () => {
    renderAdminDetails("/admin/registrations/ds-2026-000001");

    expect(await screen.findByRole("heading", { level: 1, name: "पंजीकरण विवरण" })).toBeInTheDocument();
    expect(screen.getByText("DS-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("सीता देवी")).toBeInTheDocument();
    expect(screen.getByText("ग्राम उदाहरण")).toBeInTheDocument();
    expect(screen.getByText("सत्यापन लंबित")).toBeInTheDocument();
    expect(screen.getByText("सत्यापन और स्वीकृति कैसे करें")).toBeInTheDocument();
    expect(screen.queryByText(/सुरक्षित डेटाबेस एकीकरण आवश्यक/)).not.toBeInTheDocument();
    expect(adminRegistrationServiceMocks.loadAdminRegistrationDetails).toHaveBeenCalledWith("DS-2026-000001");
  });

  it("shows invalid registration ID state without details layout", () => {
    renderAdminDetails("/admin/registrations/not-valid");

    expect(screen.getByRole("heading", { level: 1, name: "अमान्य पंजीकरण आईडी" })).toBeInTheDocument();
    expect(screen.queryByText("पंजीकरण संदर्भ")).not.toBeInTheDocument();
  });

  it("renders the Phase 08 payment-settings interface without fake financial values", async () => {
    render(
      <MemoryRouter>
        <AdminPaymentSettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 1, name: "भुगतान सेटिंग्स" })).toBeInTheDocument();
    expect(screen.getByText("भुगतान सेटिंग्स लोड हो रही हैं…")).toBeInTheDocument();

    await waitForElementToBeRemoved(() => screen.queryByText("भुगतान सेटिंग्स लोड हो रही हैं…"));

    expect(
      screen.getByText(
        "स्थानीय परीक्षण डेटा सक्रिय है। भुगतान सेटिंग्स इस मशीन के स्थानीय SQLite डेटाबेस और निजी अपलोड फ़ोल्डर में सहेजी जाएंगी।"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("स्थानीय परीक्षण डेटा")).toBeInTheDocument();
    expect(screen.getByText("ऑनलाइन भुगतान की उपलब्धता")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /ऑनलाइन भुगतान सक्षम करें/ })).not.toBeChecked();
    expect(screen.getByText("QR कोड इमेज चुनें")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "सेटिंग्स सुरक्षित रूप से सहेजें" })).toBeInTheDocument();
    expect(screen.queryByText("fake")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("dhobi.society@upi")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("धोबी समाज")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("500")).not.toBeInTheDocument();
  });

  it("renders empty audit logs from the admin service without fake records", async () => {
    render(<AdminAuditLogsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "ऑडिट लॉग" })).toBeInTheDocument();
    expect(await screen.findByText("अभी कोई ऑडिट गतिविधि उपलब्ध नहीं है।")).toBeInTheDocument();
    expect(screen.queryByText("लॉगिन प्रयास")).not.toBeInTheDocument();
    expect(adminAuditServiceMocks.loadAdminAuditLogs).toHaveBeenCalledTimes(1);
  });

  it("renders the admin profile form with the current admin login details", async () => {
    render(
      <MemoryRouter>
        <AdminProfilePage />
      </MemoryRouter>
    );

    expect(screen.getByText("प्रशासन प्रोफाइल लोड हो रही है…")).toBeInTheDocument();

    await waitForElementToBeRemoved(() => screen.queryByText("प्रशासन प्रोफाइल लोड हो रही है…"));

    expect(screen.getByRole("heading", { level: 1, name: "प्रशासन प्रोफाइल" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /प्रशासन नाम/ })).toHaveValue("Portal Admin");
    expect(screen.getByRole("textbox", { name: /ईमेल पता/ })).toHaveValue("admin@example.test");
    expect(screen.getByLabelText(/वर्तमान पासवर्ड/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "प्रोफाइल सुरक्षित रूप से सहेजें" })).toBeInTheDocument();
    expect(adminProfileServiceMocks.loadAdminProfile).toHaveBeenCalledWith(adminAuthMocks.identity);
  });
});
