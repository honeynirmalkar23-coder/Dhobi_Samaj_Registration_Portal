import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { PublicRegistrationStatus } from "../types/status-search.types";
import { PaymentRejectionGuidance } from "./PaymentRejectionGuidance";
import { RegistrationStatusResultCard } from "./RegistrationStatusResultCard";
import { RegistrationStatusTimeline } from "./RegistrationStatusTimeline";
import { ResubmissionAvailabilityCard } from "./ResubmissionAvailabilityCard";
import { StatusSearchState } from "./StatusSearchState";

const publicStatusFixture: PublicRegistrationStatus & {
  fullAddress: string;
  applicantPhotoUrl: string;
  paymentScreenshotPath: string;
  administratorNotes: string;
  internalUuid: string;
} = {
  registrationId: "DS-2026-000001",
  maskedName: "Yo**** Ku***",
  registrationCreatedAt: "2026-07-15T00:00:00.000Z",
  registrationStatus: "under_review",
  paymentStatus: "pending_verification",
  lastUpdatedAt: "2026-07-15T17:00:00.000Z",
  paymentResubmissionAllowed: false,
  publicRejectionMessage: null,
  fullAddress: "गोपनीय स्थायी पता",
  applicantPhotoUrl: "/private/photo.jpg",
  paymentScreenshotPath: "/private/payment.png",
  administratorNotes: "Internal admin note",
  internalUuid: "00000000-0000-0000-0000-000000000000"
};

function renderWithRouter(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("status-search presentational components", () => {
  it("renders only privacy-safe fields in the public result card", () => {
    renderWithRouter(<RegistrationStatusResultCard status={publicStatusFixture} />);

    expect(screen.getByText("DS-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("Yo**** Ku***")).toBeInTheDocument();
    expect(screen.getByText("समीक्षा में")).toBeInTheDocument();
    expect(screen.getByText("सत्यापन लंबित")).toBeInTheDocument();
    expect(screen.getByText("15 जुलाई 2026")).toBeInTheDocument();
    expect(screen.queryByText("under_review")).not.toBeInTheDocument();
    expect(screen.queryByText("pending_verification")).not.toBeInTheDocument();
    expect(screen.queryByText("गोपनीय स्थायी पता")).not.toBeInTheDocument();
    expect(screen.queryByText("/private/photo.jpg")).not.toBeInTheDocument();
    expect(screen.queryByText("/private/payment.png")).not.toBeInTheDocument();
    expect(screen.queryByText("Internal admin note")).not.toBeInTheDocument();
    expect(
      screen.queryByText("00000000-0000-0000-0000-000000000000")
    ).not.toBeInTheDocument();
  });

  it.each([
    ["awaiting_payment", "भुगतान प्रमाण जमा किया गया", "लंबित"],
    ["submitted", "प्रशासनिक समीक्षा", "लंबित"],
    ["under_review", "प्रशासनिक समीक्षा", "सक्रिय"],
    ["approved", "पंजीकरण स्वीकृत", "पूर्ण"],
    ["rejected", "सुधार या अस्वीकृति", "अस्वीकृत"],
    ["archived", "रिकॉर्ड संग्रहित", "संग्रहित"]
  ] as const)("renders timeline state for %s", (registrationStatus, stepText, stateText) => {
    render(<RegistrationStatusTimeline registrationStatus={registrationStatus} />);

    expect(screen.getByText(stepText)).toBeInTheDocument();
    expect(screen.getAllByText(stateText).length).toBeGreaterThan(0);
  });

  it("renders payment rejection guidance only for rejected payment status", () => {
    const { rerender } = render(
      <PaymentRejectionGuidance
        paymentResubmissionAllowed={false}
        paymentStatus="verified"
        publicRejectionMessage="सार्वजनिक निर्देश"
      />
    );

    expect(screen.queryByText("भुगतान प्रमाण के लिए मार्गदर्शन")).not.toBeInTheDocument();

    rerender(
      <PaymentRejectionGuidance
        paymentResubmissionAllowed
        paymentStatus="rejected"
        publicRejectionMessage="कृपया स्पष्ट स्क्रीनशॉट जमा करें।"
      />
    );

    expect(screen.getByText("भुगतान प्रमाण के लिए मार्गदर्शन")).toBeInTheDocument();
    expect(screen.getByText("कृपया स्पष्ट स्क्रीनशॉट जमा करें।")).toBeInTheDocument();
    expect(screen.getByText("आप नया भुगतान प्रमाण जमा कर सकते हैं।")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "नया भुगतान प्रमाण जमा करें" })).toBeDisabled();
    expect(screen.queryByText("Internal note")).not.toBeInTheDocument();
  });

  it("requires explicit resubmission permission", () => {
    const { rerender } = render(
      <ResubmissionAvailabilityCard paymentResubmissionAllowed={false} state="allowed" />
    );

    expect(screen.getByText("पुनः जमा करना उपलब्ध नहीं")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "नया भुगतान प्रमाण जमा करें" })).not.toBeInTheDocument();

    rerender(<ResubmissionAvailabilityCard paymentResubmissionAllowed state="allowed" />);

    expect(screen.getByText("पुनः जमा करने की अनुमति")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "नया भुगतान प्रमाण जमा करें" })).toBeDisabled();
  });

  it("renders future not-found state without applicant details or internal errors", () => {
    renderWithRouter(
      <StatusSearchState onReset={() => undefined} searchedRegistrationId="DS-2026-000001" state="not_found" />
    );

    expect(screen.getByText("पंजीकरण रिकॉर्ड नहीं मिला")).toBeInTheDocument();
    expect(screen.getByText(/कृपया आईडी जांचें/)).toBeInTheDocument();
    expect(screen.queryByText("Supabase")).not.toBeInTheDocument();
    expect(screen.queryByText("HTTP 404")).not.toBeInTheDocument();
    expect(screen.queryByText("Applicant")).not.toBeInTheDocument();
  });

  it("renders accessible loading state without fake progress", () => {
    renderWithRouter(
      <StatusSearchState onReset={() => undefined} searchedRegistrationId={null} state="loading" />
    );

    expect(screen.getByRole("status")).toHaveTextContent("पंजीकरण स्थिति खोजी जा रही है…");
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("renders generic error state without raw technical details", () => {
    renderWithRouter(
      <StatusSearchState onReset={() => undefined} searchedRegistrationId={null} state="error" />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("स्थिति प्राप्त नहीं हो सकी");
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/HTTP 500/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Supabase/i)).not.toBeInTheDocument();
  });
});
