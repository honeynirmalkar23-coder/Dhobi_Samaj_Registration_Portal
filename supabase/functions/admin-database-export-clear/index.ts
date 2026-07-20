import { getCorsHeaders, handleOptions } from "../_shared/cors.ts";
import { ApiError, toSafeApiError } from "../_shared/errors.ts";
import { assertRateLimit } from "../_shared/rate-limit.ts";
import { failureResponse, successResponse } from "../_shared/response.ts";
import { getAnonAwareClient, getServiceRoleClient } from "../_shared/security.ts";

const filenamePattern = /^registrations_\d{4}-\d{2}-\d{2}(?:_\d{2}-\d{2})?\.csv$/;
const storageListPageSize = 1000;
const storageRemoveBatchSize = 100;
const storageBucketsToClear = [
  "applicant-photos",
  "payment-proofs",
  "payment-acknowledgements"
] as const;

type ExportClearBody = {
  expectedExportedRows?: unknown;
  filename?: unknown;
};

type AdminUser = {
  email?: string | null;
  id: string;
};

type StorageListEntry = {
  id?: string | null;
  name: string;
};

type StorageCleanupResult = {
  bucketName: string;
  deletedObjects: number;
};

type ExportClearRpcResult = {
  deleted_rows?: number | null;
  exported_rows?: number | null;
  failure_code?: string | null;
  failure_message?: string | null;
  filename?: string | null;
  success?: boolean | null;
};

class StorageCleanupError extends Error {
  bucketName: string;
  code = "STORAGE_CLEANUP_FAILED";

  constructor(bucketName: string, message: string) {
    super(message);
    this.bucketName = bucketName;
    this.name = "StorageCleanupError";
  }
}

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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return String(error);
}

function getObjectPath(prefix: string, name: string): string {
  return prefix ? `${prefix}/${name}` : name;
}

function isFolderEntry(entry: StorageListEntry): boolean {
  return entry.id === null || entry.id === undefined;
}

async function listStorageObjects(
  supabase: ReturnType<typeof getServiceRoleClient>,
  bucketName: string,
  prefix = ""
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(prefix, {
        limit: storageListPageSize,
        offset,
        sortBy: {
          column: "name",
          order: "asc"
        }
      });

    if (error) {
      throw new StorageCleanupError(
        bucketName,
        `Storage cleanup failed while listing ${bucketName}${prefix ? `/${prefix}` : ""}: ${getErrorMessage(error)}`
      );
    }

    const entries = (data ?? []) as StorageListEntry[];

    for (const entry of entries) {
      const objectPath = getObjectPath(prefix, entry.name);

      if (isFolderEntry(entry)) {
        paths.push(...await listStorageObjects(supabase, bucketName, objectPath));
      } else {
        paths.push(objectPath);
      }
    }

    if (entries.length < storageListPageSize) {
      break;
    }

    offset += storageListPageSize;
  }

  return paths;
}

async function removeStorageObjects(
  supabase: ReturnType<typeof getServiceRoleClient>,
  bucketName: string,
  objectPaths: string[]
): Promise<void> {
  for (let index = 0; index < objectPaths.length; index += storageRemoveBatchSize) {
    const batch = objectPaths.slice(index, index + storageRemoveBatchSize);
    const { error } = await supabase.storage.from(bucketName).remove(batch);

    if (error) {
      throw new StorageCleanupError(
        bucketName,
        `Storage cleanup failed while deleting ${bucketName} objects: ${getErrorMessage(error)}`
      );
    }
  }
}

async function clearStorageBucket(
  supabase: ReturnType<typeof getServiceRoleClient>,
  bucketName: string
): Promise<StorageCleanupResult> {
  const objectPaths = await listStorageObjects(supabase, bucketName);

  if (objectPaths.length > 0) {
    await removeStorageObjects(supabase, bucketName, objectPaths);
  }

  const remainingObjects = await listStorageObjects(supabase, bucketName);

  if (remainingObjects.length > 0) {
    throw new StorageCleanupError(
      bucketName,
      `Storage cleanup incomplete for ${bucketName}: ${remainingObjects.length} object(s) remain.`
    );
  }

  return {
    bucketName,
    deletedObjects: objectPaths.length
  };
}

async function recordStorageCleanupFailureAudit(params: {
  adminUser: AdminUser;
  clientIp: string | null;
  expectedExportedRows: number;
  failure: StorageCleanupError;
  filename: string;
  supabase: ReturnType<typeof getServiceRoleClient>;
}) {
  const { error } = await params.supabase
    .from("admin_audit_logs")
    .insert({
      action: "EXPORT_AND_CLEAR_DATABASE",
      admin_user_id: params.adminUser.id,
      metadata: {
        administratorEmail: params.adminUser.email ?? "unknown-admin",
        csvFilename: params.filename,
        expectedExportedRows: params.expectedExportedRows,
        failureBucket: params.failure.bucketName,
        failureCode: params.failure.code,
        failureMessage: params.failure.message.slice(0, 200),
        ipAddress: params.clientIp,
        success: false,
        time: new Date().toISOString()
      }
    });

  if (error) {
    console.error("[admin-database-export-clear] Failed to record storage cleanup failure audit.", error);
  }
}

async function clearStorageBuckets(
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<StorageCleanupResult[]> {
  const results: StorageCleanupResult[] = [];

  for (const bucketName of storageBucketsToClear) {
    results.push(await clearStorageBucket(supabase, bucketName));
  }

  return results;
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
    const serviceRoleSupabase = getServiceRoleClient();
    const clientIp = getClientIp(request);

    try {
      await clearStorageBuckets(serviceRoleSupabase);
    } catch (error) {
      if (error instanceof StorageCleanupError) {
        await recordStorageCleanupFailureAudit({
          adminUser: userData.user,
          clientIp,
          expectedExportedRows: parsedBody.expectedExportedRows,
          failure: error,
          filename: parsedBody.filename,
          supabase: serviceRoleSupabase
        });

        throw new ApiError("EXPORT_CLEAR_FAILED", 500, `${error.message} Database tables were not cleared.`);
      }

      throw error;
    }

    const { data, error } = await supabase.rpc("admin_export_clear_database", {
      p_client_ip: clientIp,
      p_csv_filename: parsedBody.filename,
      p_expected_exported_rows: parsedBody.expectedExportedRows
    });

    if (error) {
      throw new ApiError(
        "EXPORT_CLEAR_FAILED",
        500,
        `Database clear failed${error.code ? ` (${error.code})` : ""}: ${error.message}`
      );
    }

    const result = (Array.isArray(data) ? data[0] : data) as ExportClearRpcResult | null;

    if (!result?.success) {
      const exportedRows = Number(result?.exported_rows ?? 0);
      const failureMessage = result?.failure_message?.trim();
      const failureCode = result?.failure_code?.trim();
      const isExportConflict = exportedRows !== parsedBody.expectedExportedRows;

      throw new ApiError(
        isExportConflict ? "CONFLICT" : "EXPORT_CLEAR_FAILED",
        isExportConflict ? 409 : 500,
        isExportConflict
          ? "CSV बनाते समय डेटाबेस बदल गया। कृपया फिर से निर्यात करें।"
          : `Database clear failed${failureCode ? ` (${failureCode})` : ""}: ${failureMessage ?? "Unknown SQL error."}`
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
