import { getCorsHeaders, handleOptions } from "../_shared/cors.ts";
import { ApiError, toSafeApiError } from "../_shared/errors.ts";
import { validateImageFile } from "../_shared/file-validation.ts";
import { assertRateLimit } from "../_shared/rate-limit.ts";
import { failureResponse, successResponse } from "../_shared/response.ts";
import { createSecureToken, getServiceRoleClient, sha256Hex } from "../_shared/security.ts";
import { parseRegistrationForm } from "../_shared/validation.ts";

const applicantPhotoMaxSizeBytes = 5 * 1024 * 1024;
const paymentTokenLifetimeDays = 30;
const localOperationTimeoutMs = 10_000;
const requestBodyTimeoutMs = 30_000;
const supabaseOperationTimeoutMs = 30_000;

type DebugMetadata = Record<string, unknown>;

function createDebugRequestId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function logStep(requestId: string, step: string, message: string, metadata: DebugMetadata = {}) {
  console.info("[create-registration]", {
    message,
    requestId,
    step,
    ...metadata
  });
}

function getErrorDetails(error: unknown): DebugMetadata {
  if (!error || typeof error !== "object") {
    return {
      value: String(error)
    };
  }

  const record = error as Record<string, unknown>;
  const details: DebugMetadata = {};
  const ownPropertyNames = Object.getOwnPropertyNames(error);

  for (const key of [
    "name",
    "message",
    "stack",
    "cause",
    "code",
    "details",
    "hint",
    "status",
    "statusCode",
    "statusText",
    "error",
    ...ownPropertyNames
  ]) {
    const value = record[key];

    if (value !== undefined && typeof value !== "function") {
      details[key] = value;
    }
  }

  details.ownPropertyNames = ownPropertyNames;
  details.proto = Object.getPrototypeOf(error);

  return details;
}

function logError(requestId: string, step: string, message: string, error: unknown) {
  console.error("[create-registration]", {
    error: getErrorDetails(error),
    message,
    requestId,
    step
  });
}

function logRawError(error: unknown) {
  console.error("===== RAW ERROR =====");
  console.dir(error, { depth: null });

  if (error instanceof Error) {
    console.error("===== RAW ERROR INSTANCE =====");
    console.error("name", error.name);
    console.error("message", error.message);
    console.error("stack", error.stack);
    console.error("cause", (error as Error & { cause?: unknown }).cause);
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;

    console.error("===== RAW ERROR FIELDS =====");
    console.dir({
      code: record.code,
      details: record.details,
      error: record.error,
      hint: record.hint,
      proto: Object.getPrototypeOf(error),
      status: record.status,
      statusCode: record.statusCode,
      statusText: record.statusText
    }, { depth: null });
    console.error("===== RAW ERROR PROTO =====");
    console.dir(Object.getPrototypeOf(error), { depth: null });
  }
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new ApiError("INTERNAL_ERROR", 504, timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

async function runAsyncStep<T>(
  requestId: string,
  step: string,
  message: string,
  timeoutMs: number,
  operation: () => Promise<T>
): Promise<T> {
  const startedAt = performance.now();

  logStep(requestId, step, `${step} START`, {
    operation: message,
    timeoutMs
  });
  logStep(requestId, step, `${message}: start`, { timeoutMs });

  try {
    const result = await withTimeout(
      operation(),
      timeoutMs,
      `${message} timed out after ${timeoutMs}ms.`
    );

    logStep(requestId, step, `${message}: complete`, {
      durationMs: Math.round(performance.now() - startedAt)
    });
    logStep(requestId, step, `${step} COMPLETE`, {
      durationMs: Math.round(performance.now() - startedAt),
      operation: message
    });

    return result;
  } catch (error) {
    logError(requestId, step, `${message}: failed`, error);
    throw error;
  }
}

Deno.serve(async (request) => {
  let corsHeaders: HeadersInit = {};
  const requestId = createDebugRequestId();

  try {
    logStep(requestId, "STEP 1", "request entered function", {
      method: request.method,
      url: new URL(request.url).pathname
    });

    logStep(requestId, "STEP 2", "checking CORS preflight");
    const preflight = handleOptions(request);
    if (preflight) {
      logStep(requestId, "STEP 2", "CORS preflight response returned", {
        status: preflight.status
      });
      return preflight;
    }

    logStep(requestId, "STEP 3", "building CORS headers");
    corsHeaders = getCorsHeaders(request);
    logStep(requestId, "STEP 3", "CORS headers ready");

    logStep(requestId, "STEP 4", "validating HTTP method");
    if (request.method !== "POST") {
      throw new ApiError("VALIDATION_ERROR", 405, "केवल POST अनुरोध स्वीकार है।");
    }
    logStep(requestId, "STEP 4", "HTTP method valid");

    await runAsyncStep(
      requestId,
      "STEP 5",
      "rate limit check",
      supabaseOperationTimeoutMs,
      () => assertRateLimit(request, "createRegistration", {
        debugLog: (message, metadata) => logStep(requestId, "STEP 5", message, metadata),
        fetchTimeoutMs: supabaseOperationTimeoutMs
      })
    );

    const formData = await runAsyncStep(
      requestId,
      "STEP 6",
      "multipart formData parsing",
      requestBodyTimeoutMs,
      () => request.formData()
    );

    logStep(requestId, "STEP 7", "registration form validation: start", {
      formKeys: Array.from(formData.keys())
    });
    logStep(requestId, "STEP 7", "STEP 7 START");
    const registrationInput = parseRegistrationForm(formData);
    logStep(requestId, "STEP 7", "registration form validation: complete");
    logStep(requestId, "STEP 7", "STEP 7 COMPLETE");

    const applicantPhoto = await runAsyncStep(
      requestId,
      "STEP 8",
      "applicant image validation",
      localOperationTimeoutMs,
      () => validateImageFile(
        formData.get("applicantPhoto"),
        applicantPhotoMaxSizeBytes,
        (message, metadata) => logStep(requestId, "STEP 8", message, metadata)
      )
    );

    logStep(requestId, "STEP 9", "creating Supabase service role client");
    const supabase = getServiceRoleClient({ fetchTimeoutMs: supabaseOperationTimeoutMs });
    logStep(requestId, "STEP 9", "Supabase service role client created");

    const paymentAccessToken = createSecureToken();
    const paymentAccessTokenHash = await runAsyncStep(
      requestId,
      "STEP 10",
      "payment access token hashing",
      localOperationTimeoutMs,
      () => sha256Hex(paymentAccessToken)
    );
    const uploadId = crypto.randomUUID();
    const year = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric"
    }).format(new Date());
    const applicantPhotoPath = `${year}/${uploadId}/profile.${applicantPhoto.extension}`;
    const { error: uploadError } = await runAsyncStep(
      requestId,
      "STEP 11",
      "applicant photo storage upload",
      supabaseOperationTimeoutMs,
      () => supabase.storage
        .from("applicant-photos")
        .upload(applicantPhotoPath, applicantPhoto.file, {
          contentType: applicantPhoto.mimeType,
          upsert: false
        })
    );

    if (uploadError) {
      logError(requestId, "STEP 11", "applicant photo storage upload returned Supabase Storage error", uploadError);
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + paymentTokenLifetimeDays);

    const { data, error } = await runAsyncStep(
      requestId,
      "STEP 12",
      "create_registration_record RPC",
      supabaseOperationTimeoutMs,
      () => supabase.rpc("create_registration_record", {
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
      }).abortSignal(AbortSignal.timeout(supabaseOperationTimeoutMs))
    );

    if (error) {
      logError(requestId, "STEP 12", "create_registration_record RPC returned Postgres error", error);
      await runAsyncStep(
        requestId,
        "STEP 12A",
        "cleanup uploaded applicant photo after RPC error",
        supabaseOperationTimeoutMs,
        () => supabase.storage.from("applicant-photos").remove([applicantPhotoPath])
      );
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    logStep(requestId, "STEP 13", "validating create_registration_record response");
    const createdRecord = Array.isArray(data) ? data[0] : data;

    if (!createdRecord?.registration_id) {
      logStep(requestId, "STEP 13", "create_registration_record response missing registration_id", {
        hasData: Boolean(data)
      });
      await runAsyncStep(
        requestId,
        "STEP 13A",
        "cleanup uploaded applicant photo after invalid RPC response",
        supabaseOperationTimeoutMs,
        () => supabase.storage.from("applicant-photos").remove([applicantPhotoPath])
      );
      throw new ApiError("INTERNAL_ERROR", 500);
    }
    logStep(requestId, "STEP 13", "create_registration_record response valid", {
      registrationId: createdRecord.registration_id
    });

    logStep(requestId, "STEP 14", "returning success response", {
      status: 201
    });
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
    logRawError(error);
    logError(requestId, "CATCH", "registration request failed", error);
    const safeError = toSafeApiError(error);

    logStep(requestId, "CATCH", "returning failure response", {
      code: safeError.code,
      status: safeError.status
    });
    return failureResponse(safeError.code, safeError.message, safeError.status, corsHeaders);
  }
});
