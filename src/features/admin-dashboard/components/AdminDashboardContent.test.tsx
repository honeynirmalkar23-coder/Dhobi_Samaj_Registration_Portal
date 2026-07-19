import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminRegistrationListItem } from "../types/admin-dashboard.types";
import { AdminDashboardContent } from "./AdminDashboardContent";
import { RegistrationDataTable } from "./RegistrationDataTable";
import { RegistrationMobileList } from "./RegistrationMobileList";

const dashboardServiceMocks = vi.hoisted(() => ({
  loadAdminDashboardMetrics: vi.fn(),
  loadAdminRegistrations: vi.fn(),
  buildRegistrationsCsv: vi.fn(() => "registration_id\n")
}));

vi.mock("../../admin-auth/hooks/useAdminAuth", () => ({
  useAdminAuth: () => ({
    authenticationMode: "supabase"
  })
}));

vi.mock("../../../services/admin-dashboard.service", () => dashboardServiceMocks);

const tableFixture: AdminRegistrationListItem = {
  age: 35,
  createdAt: "2026-07-15T00:00:00.000Z",
  educationLevel: "स्नातक",
  fullName: "सीता देवी",
  paymentStatus: "pending_verification",
  registrationId: "DS-2026-000001",
  registrationStatus: "under_review",
  submittedAt: "2026-07-15T00:00:00.000Z",
  totalFamilyMembers: 6,
  updatedAt: "2026-07-15T00:00:00.000Z"
};

describe("AdminDashboardContent", () => {
  beforeEach(() => {
    dashboardServiceMocks.loadAdminDashboardMetrics.mockReset();
    dashboardServiceMocks.loadAdminRegistrations.mockReset();
    dashboardServiceMocks.buildRegistrationsCsv.mockClear();
    dashboardServiceMocks.loadAdminDashboardMetrics.mockResolvedValue({
      ok: true,
      data: {
        approvedRegistrations: 4,
        awaitingPayment: 2,
        pendingVerification: 3,
        rejectedRegistrations: 1,
        submittedToday: 5,
        totalRegistrations: 12
      }
    });
    dashboardServiceMocks.loadAdminRegistrations.mockResolvedValue({
      ok: true,
      data: {
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: 0,
          totalPages: 1
        },
        rows: []
      }
    });
  });

  it("renders six metric cards with real service values", async () => {
    render(
      <MemoryRouter>
        <AdminDashboardContent />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 1, name: "प्रशासन डैशबोर्ड" })).toBeInTheDocument();
    expect(await screen.findByLabelText("कुल पंजीकरण: 12")).toBeInTheDocument();
    expect(screen.getByLabelText("भुगतान की प्रतीक्षा: 2")).toBeInTheDocument();
    expect(screen.getByLabelText("सत्यापन लंबित: 3")).toBeInTheDocument();
    expect(screen.getByLabelText("स्वीकृत पंजीकरण: 4")).toBeInTheDocument();
    expect(screen.getByLabelText("अस्वीकृत पंजीकरण: 1")).toBeInTheDocument();
    expect(screen.getByLabelText("आज जमा हुए: 5")).toBeInTheDocument();
    expect(screen.getAllByText("वास्तविक डेटाबेस डेटा")).toHaveLength(6);
    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });

  it("renders registration-management controls with empty real-data state", async () => {
    render(
      <MemoryRouter>
        <AdminDashboardContent />
      </MemoryRouter>
    );

    expect(screen.getByText("सभी पंजीकरण")).toBeInTheDocument();
    expect(await screen.findByText("कोई पंजीकरण नहीं मिला")).toBeInTheDocument();
    expect(screen.getByText("चयनित फ़िल्टर के अनुसार कोई पंजीकरण रिकॉर्ड उपलब्ध नहीं है।")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CSV निर्यात करें" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "रीफ़्रेश" })).not.toBeDisabled();
    expect(screen.queryByText("DS-2026-000001")).not.toBeInTheDocument();
  });

  it("renders future table fixtures with Hindi labels and no raw status enums", () => {
    render(
      <MemoryRouter>
        <RegistrationDataTable rows={[tableFixture]} />
      </MemoryRouter>
    );

    expect(screen.getByText("DS-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("सीता देवी")).toBeInTheDocument();
    expect(screen.getByText("समीक्षा में")).toBeInTheDocument();
    expect(screen.getByText("सत्यापन लंबित")).toBeInTheDocument();
    expect(screen.queryByText("under_review")).not.toBeInTheDocument();
    expect(screen.queryByText("pending_verification")).not.toBeInTheDocument();
  });

  it("renders future mobile list presentation", () => {
    render(
      <MemoryRouter>
        <RegistrationMobileList rows={[tableFixture]} />
      </MemoryRouter>
    );

    expect(screen.getByText("सीता देवी")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "विवरण देखें" })).toHaveAttribute(
      "href",
      "/admin/registrations/DS-2026-000001"
    );
  });
});
