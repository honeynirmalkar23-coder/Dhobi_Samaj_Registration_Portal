import { getCorsHeaders, handleOptions } from "../_shared/cors.ts";
import { ApiError, toSafeApiError } from "../_shared/errors.ts";
import { validateImageFile } from "../_shared/file-validation.ts";
import { assertRateLimit } from "../_shared/rate-limit.ts";
import { failureResponse, successResponse } from "../_shared/response.ts";
import { createSecureToken, getServiceRoleClient, sha256Hex } from "../_shared/security.ts";
import { parseRegistrationForm } from "../_shared/validation.ts";

const applicantPhotoMaxSizeBytes = 5 * 1024 * 1024;
const paymentTokenLifetimeDays = 30;

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

    await assertRateLimit(request, "createRegistration");

    const formData = await request.formData();
    const registrationInput = parseRegistrationForm(formData);
    const applicantPhoto = await validateImageFile(
      formData.get("applicantPhoto"),
      applicantPhotoMaxSizeBytes
    );
    const supabase = getServiceRoleClient();
    const paymentAccessToken = createSecureToken();
    const paymentAccessTokenHash = await sha256Hex(paymentAccessToken);
    const uploadId = crypto.randomUUID();
    const year = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric"
    }).format(new Date());
    const applicantPhotoPath = `${year}/${uploadId}/profile.${applicantPhoto.extension}`;
    const { error: uploadError } = await supabase.storage
      .from("applicant-photos")
      .upload(applicantPhotoPath, applicantPhoto.file, {
        contentType: applicantPhoto.mimeType,
        upsert: false
      });

    if (uploadError) {
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + paymentTokenLifetimeDays);

    const { data, error } = await supabase.rpc("create_registration_record", {
      p_full_name: registrationInput.fullName,
      p_age: registrationInput.age,
      p_education_level: registrationInput.educationLevel,
      p_education_details: registrationInput.educationDetails,
      p_permanent_address: registrationInput.permanentAddress,
      p_boys_count: registrationInput.boysCount,
      p_girls_count: registrationInput.girlsCount,
      p_elders_count: registrationInput.eldersCount,
      p_applicant_photo_path: applicantPhotoPath,
      p_payment_access_token_hash: paymentAccessTokenHash,
      p_payment_access_token_expires_at: expiresAt.toISOString()
    });

    if (error) {
      await supabase.storage.from("applicant-photos").remove([applicantPhotoPath]);
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    const createdRecord = Array.isArray(data) ? data[0] : data;

    if (!createdRecord?.registration_id) {
      await supabase.storage.from("applicant-photos").remove([applicantPhotoPath]);
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    return successResponse(
      {
        registrationId: createdRecord.registration_id,
        paymentAccessToken,
        createdAt: createdRecord.created_at
      },
      corsHeaders,
      201
    );
  } catch (error) {
    const safeError = toSafeApiError(error);

    return failureResponse(safeError.code, safeError.message, safeError.status, corsHeaders);
  }
});
