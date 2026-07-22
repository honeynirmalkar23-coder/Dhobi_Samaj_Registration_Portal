import type { PaymentSettingsInput } from "../features/payment-settings/types/payment-settings.types";
import { getSupabaseClient } from "../lib/supabase/client";
import type { ServiceResult } from "./api.types";
import { serviceFailure, serviceSuccess } from "./api.types";
import { createPrivateSignedUrl, removePaymentQrCode, uploadPaymentQrCode } from "./storage.service";
import { dataBackendMode } from "./backend/backend-mode";

export type AdminPaymentSettings = {
  paymentEnabled: boolean;
  qrCodePath: string | null;
  qrCodeSignedUrl: string | null;
  upiId: string | null;
  payeeName: string | null;
  amount: number | null;
  paymentTitle: string | null;
  instructions: string | null;
  publicContact: string | null;
  paymentDeadline: string | null;
  updatedAt: string | null;
  dataSource?: "local-dev" | "supabase";
  localTestingBadge?: string;
  saveMessage?: string;
};

function getExtensionFromMimeType(type: string): string {
  if (type === "image/png") {
    return "png";
  }

  if (type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function createQrStoragePath(file: File): string {
  return `active/${crypto.randomUUID()}.${getExtensionFromMimeType(file.type)}`;
}

function mapRowToSettings(row: {
  payment_enabled: boolean;
  qr_code_path: string | null;
  upi_id: string | null;
  payee_name: string | null;
  amount: number | null;
  payment_title: string | null;
  instructions: string | null;
  public_contact: string | null;
  payment_deadline: string | null;
  updated_at: string | null;
}): AdminPaymentSettings {
  return {
    paymentEnabled: row.payment_enabled,
    qrCodePath: row.qr_code_path,
    qrCodeSignedUrl: null,
    upiId: row.upi_id,
    payeeName: row.payee_name,
    amount: row.amount === null ? null : Number(row.amount),
    paymentTitle: row.payment_title,
    instructions: row.instructions,
    publicContact: row.public_contact,
    paymentDeadline: row.payment_deadline,
    updatedAt: row.updated_at
  };
}

export async function loadAdminPaymentSettings(): Promise<ServiceResult<AdminPaymentSettings>> {
  if (import.meta.env.DEV && dataBackendMode === "local-dev") {
    const { loadLocalAdminPaymentSettings } = await import("./backend/local-portal.client");

    return loadLocalAdminPaymentSettings();
  }

  return loadSupabaseAdminPaymentSettings();
}

async function loadSupabaseAdminPaymentSettings(): Promise<ServiceResult<AdminPaymentSettings>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return serviceFailure("CONFIGURATION_MISSING", "Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है।");
  }

  const { data, error } = await supabase
    .from("payment_settings")
    .select("payment_enabled, qr_code_path, upi_id, payee_name, amount, payment_title, instructions, public_contact, payment_deadline, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return serviceFailure("LOAD_FAILED", "भुगतान सेटिंग्स प्राप्त नहीं हो सकीं।");
  }

  const settings = mapRowToSettings(data);

  if (settings.qrCodePath) {
    const signedUrl = await createPrivateSignedUrl("payment-qr-codes", settings.qrCodePath);
    if (signedUrl.ok) {
      settings.qrCodeSignedUrl = signedUrl.data;
    }
  }

  return serviceSuccess(settings);
}

export async function saveAdminPaymentSettings(params: {
  input: PaymentSettingsInput;
  currentQrCodePath: string | null;
  previousQrCodePath: string | null;
}): Promise<ServiceResult<AdminPaymentSettings>> {
  if (import.meta.env.DEV && dataBackendMode === "local-dev") {
    const { saveLocalAdminPaymentSettings } = await import("./backend/local-portal.client");

    return saveLocalAdminPaymentSettings({
      currentQrCodePath: params.currentQrCodePath,
      input: params.input
    });
  }

  return saveSupabaseAdminPaymentSettings(params);
}

async function saveSupabaseAdminPaymentSettings(params: {
  input: PaymentSettingsInput;
  currentQrCodePath: string | null;
  previousQrCodePath: string | null;
}): Promise<ServiceResult<AdminPaymentSettings>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return serviceFailure("CONFIGURATION_MISSING", "Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है।");
  }

  let newQrCodePath: string | null = params.currentQrCodePath;
  let uploadedNewQr = false;

  if (params.input.qrCodeFile) {
    newQrCodePath = createQrStoragePath(params.input.qrCodeFile);
    const uploadResult = await uploadPaymentQrCode(params.input.qrCodeFile, newQrCodePath);

    if (!uploadResult.ok) {
      return uploadResult;
    }

    uploadedNewQr = true;
  }

  const { data, error } = await supabase.rpc("admin_save_payment_settings", {
    p_payment_enabled: params.input.paymentEnabled,
    p_qr_code_path: newQrCodePath,
    p_upi_id: params.input.upiId,
    p_payee_name: params.input.payeeName,
    p_amount: params.input.registrationFee,
    p_payment_title: params.input.paymentTitle,
    p_instructions: params.input.paymentInstructions,
    p_public_contact: params.input.publicSupportContact,
    p_payment_deadline: params.input.paymentDeadline
  });

  if (error) {
    if (uploadedNewQr && newQrCodePath) {
      await removePaymentQrCode(newQrCodePath);
    }
    return serviceFailure("SAVE_FAILED", "भुगतान सेटिंग्स सहेजी नहीं जा सकीं।");
  }

  const updatedRow = Array.isArray(data) ? data[0] : data;

  if (!updatedRow) {
    if (uploadedNewQr && newQrCodePath) {
      await removePaymentQrCode(newQrCodePath);
    }
    return serviceFailure("SAVE_FAILED", "भुगतान सेटिंग्स सहेजी नहीं जा सकीं।");
  }

  if (params.previousQrCodePath && params.previousQrCodePath !== newQrCodePath) {
    await removePaymentQrCode(params.previousQrCodePath);
  }

  const settings = mapRowToSettings(updatedRow);

  if (settings.qrCodePath) {
    const signedUrl = await createPrivateSignedUrl("payment-qr-codes", settings.qrCodePath);
    if (signedUrl.ok) {
      settings.qrCodeSignedUrl = signedUrl.data;
    }
  }

  return serviceSuccess(settings);
}
