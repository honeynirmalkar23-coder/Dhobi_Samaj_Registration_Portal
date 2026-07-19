import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicPaymentSettings } from "../types/payment.types";
import { QrCodeDisplay } from "./QrCodeDisplay";

const qrCodeMocks = vi.hoisted(() => ({
  toDataURL: vi.fn()
}));

vi.mock("qrcode", () => ({
  default: {
    toDataURL: qrCodeMocks.toDataURL
  }
}));

function createSettings(overrides: Partial<PublicPaymentSettings> = {}): PublicPaymentSettings {
  return {
    amount: 100,
    instructions: "Pay and upload proof.",
    payeeName: "Yogendra Kumar Bandhe",
    paymentDeadline: null,
    paymentEnabled: true,
    paymentTitle: "Dhobi Samaj Local Registration Fee",
    publicContact: "9755986476",
    qrCodeUrl: "https://signed.example/uploaded-static-qr.png",
    upiId: "yogendrakumar.yk0199@oksbi",
    ...overrides
  };
}

describe("QrCodeDisplay", () => {
  beforeEach(() => {
    qrCodeMocks.toDataURL.mockReset();
  });

  it("generates a scanner-ready UPI QR code with the saved admin amount", async () => {
    qrCodeMocks.toDataURL.mockResolvedValue("data:image/png;base64,generated-amount-qr");

    render(<QrCodeDisplay settings={createSettings()} />);

    const image = await screen.findByAltText("सहेजी गई राशि के साथ तैयार किया गया UPI भुगतान QR कोड");

    expect(image).toHaveAttribute("src", "data:image/png;base64,generated-amount-qr");
    expect(screen.getByText(/स्कैन करने पर राशि दिखाई देनी चाहिए:/)).toHaveTextContent("₹100.00");
    await waitFor(() =>
      expect(qrCodeMocks.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining("am=100.00"),
        expect.objectContaining({
          type: "image/png"
        })
      )
    );
    expect(qrCodeMocks.toDataURL).toHaveBeenCalledWith(
      expect.stringContaining("cu=INR"),
      expect.any(Object)
    );
  });

  it("falls back to the uploaded QR when there is no payable amount", () => {
    render(<QrCodeDisplay settings={createSettings({ amount: null })} />);

    expect(screen.getByAltText("प्रशासन द्वारा कॉन्फ़िगर किया गया भुगतान QR कोड")).toHaveAttribute(
      "src",
      "https://signed.example/uploaded-static-qr.png"
    );
    expect(qrCodeMocks.toDataURL).not.toHaveBeenCalled();
  });
});
