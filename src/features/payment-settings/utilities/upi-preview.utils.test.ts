import { describe, expect, it } from "vitest";
import { createSafeUpiPreview } from "./upi-preview.utils";

const validPreviewInput = {
  amount: "501",
  payeeName: "Dhobi Samaj",
  paymentTitle: "Registration Fee",
  upiId: "dhobi.local@upi"
};

describe("UPI preview utilities", () => {
  it("returns a ready URI only for valid preview data", () => {
    const result = createSafeUpiPreview(validPreviewInput);

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.uri).toBe(
        "upi://pay?pa=dhobi.local%40upi&pn=Dhobi+Samaj&am=501.00&cu=INR&tn=Registration+Fee"
      );
      expect(result.uri).not.toMatch(/undefined|null|NaN/);
    }
  });

  it("never throws and returns no URI for null, undefined, or incomplete values", () => {
    expect(() => createSafeUpiPreview({ upiId: null })).not.toThrow();
    expect(() => createSafeUpiPreview({ upiId: undefined })).not.toThrow();

    expect(createSafeUpiPreview({ ...validPreviewInput, upiId: null })).toMatchObject({
      status: "incomplete"
    });
    expect(createSafeUpiPreview({ ...validPreviewInput, upiId: undefined })).toMatchObject({
      status: "incomplete"
    });
    expect(createSafeUpiPreview({ ...validPreviewInput, amount: "" })).toMatchObject({
      status: "incomplete"
    });
    expect(createSafeUpiPreview({ ...validPreviewInput, paymentTitle: "" })).toMatchObject({
      status: "incomplete"
    });
  });

  it("returns invalid without a URI for invalid UPI IDs or amounts", () => {
    expect(createSafeUpiPreview({ ...validPreviewInput, upiId: "dhobi.local@" })).toMatchObject({
      status: "invalid"
    });
    expect(createSafeUpiPreview({ ...validPreviewInput, upiId: "abc@@upi" })).toMatchObject({
      status: "invalid"
    });
    expect(createSafeUpiPreview({ ...validPreviewInput, amount: "abc" })).toMatchObject({
      status: "invalid"
    });
    expect(createSafeUpiPreview({ ...validPreviewInput, amount: Number.NaN })).toMatchObject({
      status: "invalid"
    });
  });
});
