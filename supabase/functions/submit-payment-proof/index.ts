import { getCorsHeaders, handleOptions } from "../_shared/cors.ts";
import { ApiError, toSafeApiError } from "../_shared/errors.ts";
import { validateImageFile } from "../_shared/file-validation.ts";
import { assertRateLimit } from "../_shared/rate-limit.ts";
import { failureResponse, successResponse } from "../_shared/response.ts";
import { getServiceRoleClient, sha256Hex } from "../_shared/security.ts";
import { assertRegistrationId, normalizeString } from "../_shared/validation.ts";

const paymentProofMaxSizeBytes = 5 * 1024 * 1024;

Deno.serve(async (request) => {
  let corsHeaders: HeadersInit = {};

  try {
    const preflight = handleOptions(request);
    if (preflight) {
      return preflight;
    }

    corsHeaders = getCorsHeaders(request);

    if (request.method !== "POST") {
      throw new ApiError("VALIDATION_ERROR", 405, "केवल POST अनुरोध स्वीकार है।");
    }

    await assertRateLimit(request, "submitPaymentProof");

    const formData = await request.formData();
    const registrationId = assertRegistrationId(formData.get("registrationId"));
    const paymentAccessToken = normalizeString(formData.get("paymentAccessToken"));
    const declarationAccepted = normalizeString(formData.get("declarationAccepted"));

    if (!paymentAccessToken || declarationAccepted !== "true") {
      throw new ApiError("VALIDATION_ERROR", 400);
    }

    const paymentScreenshot = await validateImageFile(
      formData.get("paymentScreenshot"),
      paymentProofMaxSizeBytes
    );
    const tokenHash = await sha256Hex(paymentAccessToken);
    const supabase = getServiceRoleClient();
    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .select("id, registration_id, payment_status, payment_resubmission_allowed, payment_access_token_expires_at")
      .eq("registration_id", registrationId)
      .eq("payment_access_token_hash", tokenHash)
      .maybeSingle();

    if (registrationError) {
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    if (!registration || new Date(registration.payment_access_token_expires_at).getTime() <= Date.now()) {
      throw new ApiError("PAYMENT_TOKEN_INVALID", 403);
    }

    const canSubmit =
      registration.payment_status === "not_submitted" ||
      (registration.payment_status === "rejected" && registration.payment_resubmission_allowed);

    if (!canSubmit) {
      throw new ApiError("PAYMENT_SUBMISSION_NOT_ALLOWED", 409);
    }

    const year = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric"
    }).format(new Date());
    const proofId = crypto.randomUUID();
    const storagePath = `${year}/${registration.id}/${proofId}.${paymentScreenshot.extension}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(storagePath, paymentScreenshot.file, {
        contentType: paymentScreenshot.mimeType,
        upsert: false
      });

    if (uploadError) {
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    const { data, error } = await supabase.rpc("submit_payment_proof_record", {
      p_registration_id: registrationId,
      p_payment_access_token_hash: tokenHash,
      p_storage_path: storagePath,
      p_original_filename: paymentScreenshot.file.name || null,
      p_mime_type: paymentScreenshot.mimeType,
      p_size_bytes: paymentScreenshot.sizeBytes
    });

    if (error) {
      await supabase.storage.from("payment-proofs").remove([storagePath]);
      if (error.message.toLowerCase().includes("payment token invalid")) {
        throw new ApiError("PAYMENT_TOKEN_INVALID", 403);
      }
      if (error.message.toLowerCase().includes("payment submission not allowed")) {
        throw new ApiError("PAYMENT_SUBMISSION_NOT_ALLOWED", 409);
      }
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    const result = Array.isArray(data) ? data[0] : data;

    return successResponse(
      {
        registrationId: result.registration_id,
        registrationStatus: result.registration_status,
        paymentStatus: result.payment_status,
        submittedAt: result.submitted_at
      },
      corsHeaders
    );
  } catch (error) {
    const safeError = toSafeApiError(error);

    return failureResponse(safeError.code, safeError.message, safeError.status, corsHeaders);
  }
});
