import { getCorsHeaders, handleOptions } from "../_shared/cors.ts";
import { ApiError, toSafeApiError } from "../_shared/errors.ts";
import { assertRateLimit } from "../_shared/rate-limit.ts";
import { failureResponse, successResponse } from "../_shared/response.ts";
import { getServiceRoleClient } from "../_shared/security.ts";

function isCompleteEnabledSettings(settings: Record<string, unknown>): boolean {
  return Boolean(
    settings.payment_enabled &&
      settings.qr_code_path &&
      settings.upi_id &&
      settings.payee_name &&
      settings.amount &&
      Number(settings.amount) > 0 &&
      settings.payment_title &&
      settings.instructions &&
      settings.public_contact
  );
}

Deno.serve(async (request) => {
  let corsHeaders: HeadersInit = {};

  try {
    const preflight = handleOptions(request);
    if (preflight) {
      return preflight;
    }

    corsHeaders = getCorsHeaders(request);

    if (request.method !== "GET" && request.method !== "POST") {
      throw new ApiError("VALIDATION_ERROR", 405, "केवल GET या POST अनुरोध स्वीकार है।");
    }

    await assertRateLimit(request, "publicPaymentSettings");

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("payment_settings")
      .select("payment_enabled, qr_code_path, upi_id, payee_name, amount, payment_title, instructions, public_contact, payment_deadline, updated_at")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    if (!data || !isCompleteEnabledSettings(data)) {
      return successResponse(
        {
          paymentEnabled: false,
          qrCodeSignedUrl: null,
          upiId: null,
          payeeName: null,
          amount: null,
          paymentTitle: null,
          instructions: null,
          publicContact: data?.public_contact ?? null,
          paymentDeadline: null,
          updatedAt: data?.updated_at ?? null
        },
        corsHeaders
      );
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("payment-qr-codes")
      .createSignedUrl(String(data.qr_code_path), 10 * 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return successResponse(
        {
          paymentEnabled: false,
          qrCodeSignedUrl: null,
          upiId: null,
          payeeName: null,
          amount: null,
          paymentTitle: null,
          instructions: null,
          publicContact: data.public_contact,
          paymentDeadline: null,
          updatedAt: data.updated_at
        },
        corsHeaders
      );
    }

    return successResponse(
      {
        paymentEnabled: true,
        qrCodeSignedUrl: signedUrlData.signedUrl,
        upiId: data.upi_id,
        payeeName: data.payee_name,
        amount: Number(data.amount),
        paymentTitle: data.payment_title,
        instructions: data.instructions,
        publicContact: data.public_contact,
        paymentDeadline: data.payment_deadline,
        updatedAt: data.updated_at
      },
      corsHeaders
    );
  } catch (error) {
    const safeError = toSafeApiError(error);

    return failureResponse(safeError.code, safeError.message, safeError.status, corsHeaders);
  }
});
