import { normalizeUpiId } from "../../payment/utilities/upi.utils";
import type {
  PaymentSettingsDatabaseRowDraft,
  PaymentSettingsFormValues,
  PaymentSettingsInput
} from "../types/payment-settings.types";
import {
  getFuturePaymentDeadlineIso,
  normalizeOptionalString,
  parsePaymentFeeInput
} from "./payment-settings.utils";

export function mapPaymentSettingsFormToInput(
  values: PaymentSettingsFormValues
): PaymentSettingsInput {
  const normalizedUpiId = normalizeOptionalString(normalizeUpiId(values.upiId));

  return {
    paymentEnabled: values.paymentEnabled,
    qrCodeFile: values.qrCodeFile,
    upiId: normalizedUpiId,
    payeeName: normalizeOptionalString(values.payeeName),
    registrationFee: parsePaymentFeeInput(values.registrationFee),
    paymentTitle: normalizeOptionalString(values.paymentTitle),
    paymentInstructions: normalizeOptionalString(values.paymentInstructions),
    publicSupportContact: normalizeOptionalString(values.publicSupportContact),
    paymentDeadline: getFuturePaymentDeadlineIso(values.paymentDeadline)
  };
}

export function mapPaymentSettingsInputToDatabaseDraft(
  input: PaymentSettingsInput
): PaymentSettingsDatabaseRowDraft {
  return {
    payment_enabled: input.paymentEnabled,
    qr_code_path: null,
    upi_id: input.upiId,
    payee_name: input.payeeName,
    amount: input.registrationFee,
    payment_title: input.paymentTitle,
    instructions: input.paymentInstructions,
    public_contact: input.publicSupportContact,
    payment_deadline: input.paymentDeadline
  };
}
