import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentPage } from "./PaymentPage";

const paymentServiceMocks = vi.hoisted(() => ({
  getPaymentAccessToken: vi.fn(),
  getPublicPaymentSettings: vi.fn()
}));

vi.mock("../../services/payment.service", () => paymentServiceMocks);

function renderPaymentRoute(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/payment/:registrationId" element={<PaymentPage />} />
        <Route path="/payment" element={<PaymentPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PaymentPage", () => {
  beforeEach(() => {
    paymentServiceMocks.getPaymentAccessToken.mockReset();
    paymentServiceMocks.getPublicPaymentSettings.mockReset();
    paymentServiceMocks.getPaymentAccessToken.mockReturnValue("browser-session-payment-token");
    paymentServiceMocks.getPublicPaymentSettings.mockResolvedValue({
      ok: true,
      data: {
        amount: null,
        instructions: null,
        payeeName: null,
        paymentDeadline: null,
        paymentEnabled: false,
        paymentTitle: null,
        publicContact: null,
        qrCodeUrl: null,
        updatedAt: null,
        upiId: null
      }
    });
  });

  it("normalizes a valid registration ID route and renders the payment interface", async () => {
    renderPaymentRoute("/payment/ds-2026-000001");

    expect(
      await screen.findByRole("heading", { level: 1, name: "भुगतान और प्रमाण जमा करना" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("DS-2026-000001").length).toBeGreaterThan(0);
    expect(screen.queryByText("भुगतान स्क्रीनशॉट")).not.toBeInTheDocument();
    expect(screen.getByText("भुगतान सेटिंग्स अभी कॉन्फ़िगर नहीं हैं।")).toBeInTheDocument();
    expect(paymentServiceMocks.getPublicPaymentSettings).toHaveBeenCalledTimes(1);
    expect(paymentServiceMocks.getPaymentAccessToken).toHaveBeenCalledWith("DS-2026-000001");

    await waitFor(() =>
      expect(document.title).toBe(
        "पंजीकरण शुल्क भुगतान | धोबी समाज पंजीकरण पोर्टल"
      )
    );
  });

  it("shows a route-level error for an invalid registration ID without rendering the proof form", async () => {
    renderPaymentRoute("/payment/not-a-registration-id");

    expect(
      screen.getByRole("heading", { level: 1, name: "अमान्य पंजीकरण आईडी" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("भुगतान पृष्ठ खोलने के लिए मान्य पंजीकरण आईडी आवश्यक है।")
    ).toBeInTheDocument();
    expect(screen.getByText(/प्राप्त मान:/)).toHaveTextContent("not-a-registration-id");
    expect(screen.queryByText("भुगतान स्क्रीनशॉट")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "पंजीकरण खोजें" })).toHaveAttribute("href", "/status");
    expect(screen.getByRole("link", { name: "होम पेज पर जाएं" })).toHaveAttribute("href", "/");

    await waitFor(() =>
      expect(document.title).toBe(
        "अमान्य पंजीकरण आईडी | धोबी समाज पंजीकरण पोर्टल"
      )
    );
  });
});
