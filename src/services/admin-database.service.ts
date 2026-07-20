import { getSupabaseClient } from "../lib/supabase/client";
import { dataBackendMode } from "./backend/backend-mode";
import type { ApiResponse, ServiceResult } from "./api.types";
import { serviceFailure, serviceSuccess } from "./api.types";
import type {
  AdminRegistrationExportRow,
  ExportClearDatabaseResult
} from "./admin-database.types";

function getConfigurationFailure<T>(): ServiceResult<T> {
  return serviceFailure("CONFIGURATION_MISSING", "Supabase कॉन्फ़िगरेशन उपलब्ध नहीं है।");
}

export async function loadAdminRegistrationExportRows(): Promise<ServiceResult<AdminRegistrationExportRow[]>> {
  if (dataBackendMode === "local-dev") {
    const { loadLocalAdminRegistrationExportRows } = await import("./backend/local-portal.client");

    return loadLocalAdminRegistrationExportRows();
  }

  return loadSupabaseAdminRegistrationExportRows();
}

async function loadSupabaseAdminRegistrationExportRows(): Promise<ServiceResult<AdminRegistrationExportRow[]>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return getConfigurationFailure();
  }

  const { data, error } = await supabase.rpc("admin_export_registrations");

  if (error) {
    return serviceFailure("EXPORT_ROWS_FAILED", "निर्यात के लिए पंजीकरण प्राप्त नहीं हो सके।");
  }

  return serviceSuccess((data ?? []).map((row) => ({
    address: row.address,
    age: Number(row.age),
    boys: Number(row.boys),
    createdAt: row.created_at,
    dob: row.dob,
    education: row.education,
    elderly: Number(row.elderly),
    fullName: row.full_name,
    girls: Number(row.girls),
    paymentAmount: row.payment_amount === null ? null : Number(row.payment_amount),
    paymentReference: row.payment_reference,
    paymentStatus: row.payment_status,
    paymentUtr: row.payment_utr,
    registrationId: row.registration_id,
    updatedAt: row.updated_at
  })));
}

export async function runAdminDatabaseExportClear(params: {
  expectedExportedRows: number;
  filename: string;
}): Promise<ServiceResult<ExportClearDatabaseResult>> {
  if (dataBackendMode === "local-dev") {
    const { runLocalAdminDatabaseExportClear } = await import("./backend/local-portal.client");

    return runLocalAdminDatabaseExportClear(params);
  }

  return runSupabaseAdminDatabaseExportClear(params);
}

async function readExportClearFunctionFailure(
  response: Response | undefined
): Promise<ServiceResult<ExportClearDatabaseResult> | null> {
  if (!response) {
    return null;
  }

  try {
    const body = await response.clone().json() as ApiResponse<ExportClearDatabaseResult>;

    if (!body.success) {
      return serviceFailure(body.error.code, body.error.message, response.status);
    }
  } catch {
    return null;
  }

  return null;
}

async function runSupabaseAdminDatabaseExportClear(params: {
  expectedExportedRows: number;
  filename: string;
}): Promise<ServiceResult<ExportClearDatabaseResult>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return getConfigurationFailure();
  }

  const { data, error, response } = await supabase.functions.invoke<ApiResponse<ExportClearDatabaseResult>>(
    "admin-database-export-clear",
    {
      body: {
        expectedExportedRows: params.expectedExportedRows,
        filename: params.filename
      }
    }
  );

  if (error) {
    return await readExportClearFunctionFailure(response)
      ?? serviceFailure("NETWORK_ERROR", "सुरक्षित सेवा से संपर्क नहीं हो सका।");
  }

  if (!data) {
    return serviceFailure("EMPTY_RESPONSE", "सर्वर से मान्य उत्तर नहीं मिला।");
  }

  if (!data.success) {
    return serviceFailure(data.error.code, data.error.message, response?.status);
  }

  return serviceSuccess(data.data);
}
