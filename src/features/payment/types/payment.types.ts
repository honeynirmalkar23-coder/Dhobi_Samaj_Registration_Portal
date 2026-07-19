import type { FieldErrors } from "react-hook-form";

export type PublicPaymentSettings = {
  paymentEnabled: boolean;
  qrCodeUrl: string | null;
  upiId: string | null;
  payeeName: string | null;
  amount: number | null;
  paymentTitle: string | null;
  instructions: string | null;
  publicContact: string | null;
  paymentDeadline: string | null;
};

export type PaymentProofFormInputValues = {
  paymentScreenshot: File | null;
  declarationAccepted: boolean;
};

export type PaymentProofFormValues = {
  paymentScreenshot: File;
  declarationAccepted: true;
};

export type PaymentProofFieldName = keyof PaymentProofFormInputValues;

export type PaymentProofFormErrors = FieldErrors<PaymentProofFormInputValues>;
