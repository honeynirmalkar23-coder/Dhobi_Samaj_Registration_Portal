import { describe, expect, it, vi } from "vitest";
import { paymentSettingsSchema } from "./payment-settings.schema";
import { paymentSettingsDefaults } from "../utilities/payment-settings.utils";

function createQrFile(name = "payment-qr.png", type = "image/png", content: BlobPart = "qr") {
  return new File([content], name, { type });
}

const validEnabledValues = {
  paymentEnabled: true,
  qrCodeFile: createQrFile(),
  existingQrCodePath: "",
  upiId: "samaj.test@upi",
  payeeName: "धोबी समाज",
  registrationFee: "500.50",
  paymentTitle: "धोबी समाज सदस्य पंजीकरण शुल्क",
  paymentInstructions: "भुगतान के बाद स्क्रीनशॉट सुरक्षित रखें।",
  publicSupportContact: "payment-help@example.test",
  paymentDeadline: ""
};

describe("paymentSettingsSchema", () => {
  it("allows an empty disabled configuration", () => {
    const result = paymentSettingsSchema.safeParse(paymentSettingsDefaults);

    expect(result.success).toBe(true);
  });

  it("requires payment details only when payment is enabled", () => {
    const result = paymentSettingsSchema.safeParse({
      ...paymentSettingsDefaults,
      paymentEnabled: true
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);

      expect(messages).toContain("ऑनलाइन भुगतान सक्षम करने के लिए QR कोड चुनें।");
      expect(messages).toContain("ऑनलाइन भुगतान सक्षम करने के लिए UPI आईडी दर्ज करें।");
      expect(messages).toContain("कृपया प्राप्तकर्ता का नाम दर्ज करें।");
      expect(messages).toContain("कृपया पंजीकरण शुल्क दर्ज करें।");
      expect(messages).toContain("कृपया भुगतान शीर्षक दर्ज करें।");
      expect(messages).toContain("कृपया भुगतान निर्देश दर्ज करें।");
      expect(messages).toContain("कृपया भुगतान सहायता संपर्क दर्ज करें।");
    }
  });

  it("accepts a complete test-only enabled configuration", () => {
    const result = paymentSettingsSchema.safeParse(validEnabledValues);

    expect(result.success).toBe(true);
  });

  it("validates UPI ID, payee name, title, instructions, and contact copy", () => {
    const result = paymentSettingsSchema.safeParse({
      ...validEnabledValues,
      upiId: "not valid",
      payeeName: " अ ",
      paymentTitle: "शु",
      paymentInstructions: "छोटा",
      publicSupportContact: "123"
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);

      expect(messages).toContain("कृपया मान्य UPI आईडी दर्ज करें।");
      expect(messages).toContain("प्राप्तकर्ता का नाम कम से कम 2 अक्षरों का होना चाहिए।");
      expect(messages).toContain("भुगतान शीर्षक कम से कम 3 अक्षरों का होना चाहिए।");
      expect(messages).toContain("भुगतान निर्देश कम से कम 10 अक्षरों के होने चाहिए।");
      expect(messages).toContain("सहायता संपर्क कम से कम 5 अक्षरों का होना चाहिए।");
    }
  });

  it("validates registration fee edge cases", () => {
    expect(
      paymentSettingsSchema.safeParse({ ...validEnabledValues, registrationFee: "0" }).success
    ).toBe(false);
    expect(
      paymentSettingsSchema.safeParse({ ...validEnabledValues, registrationFee: "-1" }).success
    ).toBe(false);
    expect(
      paymentSettingsSchema.safeParse({ ...validEnabledValues, registrationFee: "1e3" }).success
    ).toBe(false);
    expect(
      paymentSettingsSchema.safeParse({ ...validEnabledValues, registrationFee: "25.125" }).success
    ).toBe(false);
    expect(
      paymentSettingsSchema.safeParse({ ...validEnabledValues, registrationFee: "100000.01" }).success
    ).toBe(false);
    expect(
      paymentSettingsSchema.safeParse({ ...validEnabledValues, registrationFee: "100000" }).success
    ).toBe(true);
  });

  it("validates optional deadline with stable time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-16T10:00:00"));

    expect(
      paymentSettingsSchema.safeParse({ ...validEnabledValues, paymentDeadline: "" }).success
    ).toBe(true);
    expect(
      paymentSettingsSchema.safeParse({
        ...validEnabledValues,
        paymentDeadline: "2026-07-16T09:00"
      }).success
    ).toBe(false);
    expect(
      paymentSettingsSchema.safeParse({
        ...validEnabledValues,
        paymentDeadline: "2026-07-17T11:00"
      }).success
    ).toBe(true);

    vi.useRealTimers();
  });
});
