import { describe, expect, it } from "vitest";
import type { PublicPaymentSettings } from "../types/payment.types";
import { buildUpiDeepLink, buildUpiPaymentUrl, isValidUpiId, normalizeUpiId } from "./upi.utils";

const baseSettings: PublicPaymentSettings = {
  paymentEnabled: true,
  qrCodeUrl: null,
  upiId: null,
  payeeName: null,
  amount: null,
  paymentTitle: null,
  instructions: null,
  publicContact: null,
  paymentDeadline: null
};

describe("upi utilities", () => {
  it("normalizes and validates UPI IDs without accepting malformed values", () => {
    expect(normalizeUpiId("  dhobi.society@upi  ")).toBe("dhobi.society@upi");
    expect(normalizeUpiId(null)).toBe("");
    expect(normalizeUpiId(undefined)).toBe("");
    expect(isValidUpiId("dhobi.society@upi")).toBe(true);
    expect(isValidUpiId("dhobi society@upi")).toBe(false);
    expect(isValidUpiId("dhobi.society")).toBe(false);
    expect(isValidUpiId(null)).toBe(false);
  });

  it("returns no deep link until a valid UPI ID exists", () => {
    expect(buildUpiDeepLink(baseSettings)).toBeNull();
    expect(buildUpiDeepLink({ ...baseSettings, upiId: "invalid-upi" })).toBeNull();
    expect(buildUpiDeepLink({ ...baseSettings, amount: Number.NaN, upiId: "dhobi.society@upi" })).toBe(
      "upi://pay?pa=dhobi.society%40upi"
    );
  });

  it("builds a UPI deep link from future administrator settings", () => {
    const deepLink = buildUpiDeepLink({
      ...baseSettings,
      upiId: "dhobi.society@upi",
      payeeName: "Dhobi Samaj",
      amount: 251,
      paymentTitle: "Registration Fee"
    });

    expect(deepLink).toBe(
      "upi://pay?pa=dhobi.society%40upi&pn=Dhobi+Samaj&am=251.00&cu=INR&tn=Registration+Fee"
    );
    expect(buildUpiPaymentUrl({ ...baseSettings, upiId: "dhobi.society@upi" })).toBe(
      "upi://pay?pa=dhobi.society%40upi"
    );
  });
});
