import { getSupabaseClient } from "../lib/supabase/client";
import type { ServiceResult } from "./api.types";
import { serviceFailure, serviceSuccess } from "./api.types";

const signedUrlExpiresInSeconds = 10 * 60;

export async function createPrivateSignedUrl(
  bucket: "applicant-photos" | "payment-proofs" | "payment-qr-codes",
  path: string
): Promise<ServiceResult<string>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return serviceFailure("CONFIGURATION_MISSING", "Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है।");
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, signedUrlExpiresInSeconds);

  if (error || !data?.signedUrl) {
    return serviceFailure("SIGNED_URL_ERROR", "निजी फाइल का सुरक्षित लिंक नहीं बन सका।");
  }

  return serviceSuccess(data.signedUrl);
}

export async function uploadPaymentQrCode(file: File, path: string): Promise<ServiceResult<string>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return serviceFailure("CONFIGURATION_MISSING", "Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है।");
  }

  const { error } = await supabase.storage.from("payment-qr-codes").upload(path, file, {
    contentType: file.type,
    upsert: false
  });

  if (error) {
    return serviceFailure("QR_UPLOAD_FAILED", "QR कोड अपलोड नहीं हो सका।");
  }

  return serviceSuccess(path);
}

export async function removePaymentQrCode(path: string): Promise<void> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return;
  }

  await supabase.storage.from("payment-qr-codes").remove([path]);
}
