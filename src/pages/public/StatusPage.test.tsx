import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StatusPage } from "./StatusPage";

const statusServiceMocks = vi.hoisted(() => ({
  getPublicRegistrationStatus: vi.fn()
}));

vi.mock("../../services/status-search.service", () => statusServiceMocks);

function LocationProbe() {
  const location = useLocation();

  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderStatusPage(initialEntry = "/status") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <StatusPage />
      <LocationProbe />
    </MemoryRouter>
  );
}

describe("StatusPage", () => {
  beforeEach(() => {
    statusServiceMocks.getPublicRegistrationStatus.mockReset();
    statusServiceMocks.getPublicRegistrationStatus.mockResolvedValue({
      ok: true,
      data: {
        lastUpdatedAt: "2026-07-16T00:00:00.000Z",
        maskedName: "सी**** दे**",
        paymentResubmissionAllowed: false,
        paymentStatus: "pending_verification",
        publicRejectionMessage: null,
        registrationCreatedAt: "2026-07-15T00:00:00.000Z",
        registrationId: "DS-2026-000001",
        registrationStatus: "under_review"
      }
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a Hindi required error for an empty search", async () => {
    const user = userEvent.setup();
    renderStatusPage();

    await user.click(screen.getByRole("button", { name: "स्थिति देखें" }));

    expect(await screen.findByText("कृपया पंजीकरण आईडी दर्ज करें।")).toBeInTheDocument();
    expect(screen.queryByText("स्थिति खोज सेवा अभी उपलब्ध नहीं है")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/status");
    expect(statusServiceMocks.getPublicRegistrationStatus).not.toHaveBeenCalled();
  });

  it.each(["DS2026000001", "DS-26-000001", "ABC-2026-000001", "DS-2026-1"])(
    "shows a format error for invalid ID %s",
    async (registrationId) => {
      const user = userEvent.setup();
      renderStatusPage();

      await user.type(screen.getByLabelText(/पंजीकरण आईडी/), registrationId);
      await user.click(screen.getByRole("button", { name: "स्थिति देखें" }));

      expect(
        await screen.findByText(
          "कृपया DS-YYYY-000001 प्रारूप में मान्य पंजीकरण आईडी दर्ज करें।"
        )
      ).toBeInTheDocument();
      expect(screen.queryByText("स्थिति खोज सेवा अभी उपलब्ध नहीं है")).not.toBeInTheDocument();
      expect(screen.getByTestId("location")).toHaveTextContent("/status");
      expect(statusServiceMocks.getPublicRegistrationStatus).not.toHaveBeenCalled();
    }
  );

  it("normalizes a valid search, updates the URL, and shows privacy-safe status result", async () => {
    const user = userEvent.setup();
    renderStatusPage();

    await user.type(screen.getByLabelText(/पंजीकरण आईडी/), "  ds-2026-000001  ");
    await user.click(screen.getByRole("button", { name: "स्थिति देखें" }));

    expect(screen.getByLabelText(/पंजीकरण आईडी/)).toHaveValue("DS-2026-000001");
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/status?registrationId=DS-2026-000001"
    );
    expect(await screen.findByText("सार्वजनिक स्थिति परिणाम")).toBeInTheDocument();
    expect(screen.getAllByText("DS-2026-000001").length).toBeGreaterThan(0);
    expect(screen.getByText("सी**** दे**")).toBeInTheDocument();
    expect(screen.getAllByText("समीक्षा में").length).toBeGreaterThan(0);
    expect(screen.getAllByText("सत्यापन लंबित").length).toBeGreaterThan(0);
    expect(screen.queryByText("स्थिति खोज सेवा अभी उपलब्ध नहीं है")).not.toBeInTheDocument();
    expect(screen.queryByText("स्थायी पता")).not.toBeInTheDocument();
    expect(statusServiceMocks.getPublicRegistrationStatus).toHaveBeenCalledWith("DS-2026-000001");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("shows a not-found state when the public lookup returns no record", async () => {
    const user = userEvent.setup();
    statusServiceMocks.getPublicRegistrationStatus.mockResolvedValueOnce({
      ok: false,
      code: "NOT_FOUND",
      message: "रिकॉर्ड नहीं मिला"
    });
    renderStatusPage();

    await user.type(screen.getByLabelText(/पंजीकरण आईडी/), "ds-2026-000999");
    await user.click(screen.getByRole("button", { name: "स्थिति देखें" }));

    expect(await screen.findByText("पंजीकरण रिकॉर्ड नहीं मिला")).toBeInTheDocument();
    expect(screen.queryByText("Supabase")).not.toBeInTheDocument();
  });

  it("prefills a normalized query parameter without showing a fake lookup result", () => {
    renderStatusPage("/status?registrationId=ds-2026-000001");

    expect(screen.getByLabelText(/पंजीकरण आईडी/)).toHaveValue("DS-2026-000001");
    expect(screen.queryByText("स्थिति खोज सेवा अभी उपलब्ध नहीं है")).not.toBeInTheDocument();
    expect(screen.queryByText("सार्वजनिक स्थिति परिणाम")).not.toBeInTheDocument();
  });

  it("resets search state, removes query parameter, and returns focus to the input", async () => {
    const user = userEvent.setup();
    renderStatusPage();

    await user.type(screen.getByLabelText(/पंजीकरण आईडी/), "ds-2026-000001");
    await user.click(screen.getByRole("button", { name: "स्थिति देखें" }));
    await screen.findByText("सार्वजनिक स्थिति परिणाम");
    await user.click(screen.getAllByRole("button", { name: "नई खोज करें" })[0]);

    expect(screen.getByLabelText(/पंजीकरण आईडी/)).toHaveValue("");
    expect(screen.getByTestId("location")).toHaveTextContent("/status");
    expect(screen.queryByText("स्थिति खोज सेवा अभी उपलब्ध नहीं है")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/पंजीकरण आईडी/)).toHaveFocus());
  });
});
