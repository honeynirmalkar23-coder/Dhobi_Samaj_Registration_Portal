import type { FieldErrors } from "react-hook-form";
import type { PublicPaymentSettings } from "../../payment/types/payment.types";

export type PaymentSettingsFormValues = {
  paymentEnabled: boolean;
  qrCodeFile: File | null;
  existingQrCodePath: string;
  upiId: string;
  payeeName: string;
  registrationFee: string;
  paymentTitle: string;
  paymentInstructions: string;
  publicSupportContact: string;
  paymentDeadline: string;
};

export type PaymentSettingsInput = {
  paymentEnabled: boolean;
  qrCodeFile: File | null;
  upiId: string | null;
  payeeName: string | null;
  registrationFee: number | null;
  paymentTitle: string | null;
  paymentInstructions: string | null;
  publicSupportContact: string | null;
  paymentDeadline: string | null;
};

export type PaymentSettingsDatabaseRowDraft = {
  payment_enabled: boolean;
  qr_code_path: null;
  upi_id: string | null;
  payee_name: string | null;
  amount: number | null;
  payment_title: string | null;
  instructions: string | null;
  public_contact: string | null;
  payment_deadline: string | null;
};

export type PaymentSettingsCapabilityState = {
  canRead: false;
  canSave: false;
  status: "backend_unavailable";
  message: string;
};

export type PaymentSettingsSaveResult = {
  status: "backend_unavailable";
};

export type PaymentSettingsService = {
  getActiveSettings: () => Promise<PublicPaymentSettings | null>;
  saveSettings: (input: PaymentSettingsInput) => Promise<PaymentSettingsSaveResult>;
  capability: PaymentSettingsCapabilityState;
};

export type PaymentSettingsFormErrors = FieldErrors<PaymentSettingsFormValues>;
