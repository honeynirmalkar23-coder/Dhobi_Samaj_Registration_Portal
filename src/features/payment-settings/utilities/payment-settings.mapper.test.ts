import { describe, expect, it } from "vitest";
import type { PaymentSettingsFormValues } from "../types/payment-settings.types";
import {
  mapPaymentSettingsFormToInput,
  mapPaymentSettingsInputToDatabaseDraft
} from "./payment-settings.mapper";
import { paymentSettingsDefaults } from "./payment-settings.utils";

describe("payment settings mapper", () => {
  it("normalizes strings, fee, and deadline while keeping QR upload separate", () => {
    const qrCodeFile = new File(["qr"], "qr.png", { type: "image/png" });
    const values: PaymentSettingsFormValues = {
      ...paymentSettingsDefaults,
      paymentEnabled: true,
      qrCodeFile,
      upiId: "  samaj.test@upi  ",
      payeeName: "  धोबी समाज  ",
      registrationFee: "500.25",
      paymentTitle: "  पंजीकरण शुल्क  ",
      paymentInstructions: "  भुगतान के बाद स्क्रीनशॉट रखें।  ",
      publicSupportContact: "  help@example.test  ",
      paymentDeadline: "2026-07-17T12:30"
    };

    const input = mapPaymentSettingsFormToInput(values);
    const rowDraft = mapPaymentSettingsInputToDatabaseDraft(input);

    expect(input).toMatchObject({
      paymentEnabled: true,
      qrCodeFile,
      upiId: "samaj.test@upi",
      payeeName: "धोबी समाज",
      registrationFee: 500.25,
      paymentTitle: "पंजीकरण शुल्क",
      paymentInstructions: "भुगतान के बाद स्क्रीनशॉट रखें।",
      publicSupportContact: "help@example.test"
    });
    expect(input.paymentDeadline).toMatch(/^2026-07-17T/);
    expect(rowDraft).toEqual({
      payment_enabled: true,
      qr_code_path: null,
      upi_id: "samaj.test@upi",
      payee_name: "धोबी समाज",
      amount: 500.25,
      payment_title: "पंजीकरण शुल्क",
      instructions: "भुगतान के बाद स्क्रीनशॉट रखें।",
      public_contact: "help@example.test",
      payment_deadline: input.paymentDeadline
    });
    expect(rowDraft).not.toHaveProperty("qrCodeFile");
    expect(rowDraft).not.toHaveProperty("created_at");
    expect(rowDraft).not.toHaveProperty("updated_at");
    expect(rowDraft).not.toHaveProperty("updated_by");
  });

  it("maps empty strings to null values", () => {
    const input = mapPaymentSettingsFormToInput(paymentSettingsDefaults);
    const rowDraft = mapPaymentSettingsInputToDatabaseDraft(input);

    expect(input).toMatchObject({
      paymentEnabled: false,
      qrCodeFile: null,
      upiId: null,
      payeeName: null,
      registrationFee: null,
      paymentTitle: null,
      paymentInstructions: null,
      publicSupportContact: null,
      paymentDeadline: null
    });
    expect(rowDraft.qr_code_path).toBeNull();
  });
});
