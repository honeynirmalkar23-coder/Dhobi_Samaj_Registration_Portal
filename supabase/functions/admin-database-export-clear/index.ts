import { getCorsHeaders, handleOptions } from "../_shared/cors.ts";
import { ApiError, toSafeApiError } from "../_shared/errors.ts";
import { assertRateLimit } from "../_shared/rate-limit.ts";
import { failureResponse, successResponse } from "../_shared/response.ts";
import { getAnonAwareClient } from "../_shared/security.ts";

const filenamePattern = /^registrations_\d{4}-\d{2}-\d{2}(?:_\d{2}-\d{2})?\.csv$/;

type ExportClearBody = {
  expectedExportedRows?: unknown;
  filename?: unknown;
};

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim() ?? "";

  return cfConnectingIp || forwardedFor || null;
}

function parseBody(body: ExportClearBody): {
  expectedExportedRows: number;
  filename: string;
} {
  const expectedExportedRows = Number(body.expectedExportedRows);
  const filename = typeof body.filename === "string" ? body.filename.trim() : "";

  if (
    !Number.isSafeInteger(expectedExportedRows) ||
    expectedExportedRows < 0 ||
    expectedExportedRows > 1_000_000 ||
    !filenamePattern.test(filename)
  ) {
    throw new ApiError("VALIDATION_ERROR", 400);
  }

  return {
    expectedExportedRows,
    filename
  };
}

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

    await assertRateLimit(request, "adminDatabaseExportClear");

    const supabase = getAnonAwareClient(request);
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new ApiError("UNAUTHORIZED", 401);
    }

    if (userData.user.app_metadata?.role !== "admin") {
      throw new ApiError("FORBIDDEN", 403);
    }

    const parsedBody = parseBody(await request.json().catch(() => ({})) as ExportClearBody);
    const { data, error } = await supabase.rpc("admin_export_clear_database", {
      p_client_ip: getClientIp(request),
      p_csv_filename: parsedBody.filename,
      p_expected_exported_rows: parsedBody.expectedExportedRows
    });

    if (error) {
      if (error.code === "42501") {
        throw new ApiError("FORBIDDEN", 403);
      }

      throw new ApiError("EXPORT_CLEAR_FAILED", 500);
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result?.success) {
      throw new ApiError(
        Number(result?.exported_rows ?? 0) !== parsedBody.expectedExportedRows ? "CONFLICT" : "EXPORT_CLEAR_FAILED",
        Number(result?.exported_rows ?? 0) !== parsedBody.expectedExportedRows ? 409 : 500,
        Number(result?.exported_rows ?? 0) !== parsedBody.expectedExportedRows
          ? "CSV बनाते समय डेटाबेस बदल गया। कृपया फिर से निर्यात करें।"
          : undefined
      );
    }

    return successResponse(
      {
        deletedRows: Number(result.deleted_rows ?? 0),
        exportedRows: Number(result.exported_rows ?? 0),
        filename: String(result.filename ?? parsedBody.filename)
      },
      corsHeaders
    );
  } catch (error) {
    const safeError = toSafeApiError(error);

    return failureResponse(safeError.code, safeError.message, safeError.status, corsHeaders);
  }
});

