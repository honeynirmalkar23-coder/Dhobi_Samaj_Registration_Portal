import { getCorsHeaders, handleOptions } from "../_shared/cors.ts";
import { ApiError, toSafeApiError } from "../_shared/errors.ts";
import { assertRateLimit } from "../_shared/rate-limit.ts";
import { failureResponse, successResponse } from "../_shared/response.ts";
import { getServiceRoleClient } from "../_shared/security.ts";
import { assertRegistrationId } from "../_shared/validation.ts";

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

    await assertRateLimit(request, "statusLookup");

    const body = await request.json().catch(() => ({}));
    const registrationId = assertRegistrationId(body.registrationId);
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.rpc("get_public_registration_status", {
      p_registration_id: registrationId
    });

    if (error) {
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
      return failureResponse("NOT_FOUND", "दर्ज की गई पंजीकरण आईडी से कोई सार्वजनिक रिकॉर्ड नहीं मिला।", 404, corsHeaders);
    }

    return successResponse(
      {
        registrationId: result.registration_id,
        maskedName: result.masked_name,
        registrationCreatedAt: result.registration_created_at,
        registrationStatus: result.registration_status,
        paymentStatus: result.payment_status,
        lastUpdatedAt: result.last_updated_at,
        paymentResubmissionAllowed: result.payment_resubmission_allowed,
        publicRejectionMessage: result.public_rejection_message
      },
      corsHeaders
    );
  } catch (error) {
    const safeError = toSafeApiError(error);

    return failureResponse(safeError.code, safeError.message, safeError.status, corsHeaders);
  }
});
