// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { Database } from "better-sqlite3";
import type { IncomingMessage, ServerResponse } from "node:http";
import { insertAuditLog } from "./local-portal.audit";
import { requireLocalAdmin, validateAdminStateChangingRequest } from "./local-portal.admin";
import { removeStoredUpload } from "./local-portal.files";
import { getJsonRecord, readJsonBody, writeFailure, writeSuccess } from "./local-portal.responses";
import type { LocalAdminIdentity, LocalPortalConfig, PaymentStatus } from "./local-portal.types";

const csvFilenamePattern = /^registrations_\d{4}-\d{2}-\d{2}(?:_\d{2}-\d{2})?\.csv$/;

type LocalRegistrationExportRow = {
  registrationId: string;
  fullName: string;
  mobileNumber: string | null;
  dob: string | null;
  age: number;
  education: string;
  address: string;
  boys: number;
  girls: number;
  elderly: number;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  paymentUtr: string | null;
  paymentAmount: number | null;
  createdAt: string;
  updatedAt: string;
};

type ExportClearRequestBody = {
  expectedExportedRows: number;
  filename: string;
};

type ExportClearResult = {
  success: true;
  exportedRows: number;
  deletedRows: number;
  filename: string;
};

type StoredUploadPathRow = {
  path: string;
};

function getClientIp(request: IncomingMessage): string | null {
  const forwardedFor = request.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];
  const ip = firstForwarded?.trim() || request.socket.remoteAddress || "";

  return ip || null;
}

function validateRequestBody(value: Record<string, unknown>): ExportClearRequestBody | null {
  const expectedExportedRows = Number(value.expectedExportedRows);
  const filename = typeof value.filename === "string" ? value.filename.trim() : "";

  if (
    !Number.isSafeInteger(expectedExportedRows) ||
    expectedExportedRows < 0 ||
    expectedExportedRows > 1_000_000 ||
    !csvFilenamePattern.test(filename)
  ) {
    return null;
  }

  return {
    expectedExportedRows,
    filename
  };
}

function getExportRows(db: Database): LocalRegistrationExportRow[] {
  const rows = db.prepare(`
    SELECT
      r.registration_id,
      r.full_name,
      r.mobile_number,
      r.age,
      r.education_level,
      r.permanent_address,
      r.boys_count,
      r.girls_count,
      r.elders_count,
      r.payment_status,
      ps.amount AS payment_amount,
      r.created_at,
      r.updated_at
    FROM registrations r
    LEFT JOIN payment_settings ps ON ps.id = 1
    ORDER BY r.created_at ASC, r.registration_id ASC
  `).all() as Array<{
    registration_id: string;
    full_name: string;
    mobile_number: string | null;
    age: number;
    education_level: string;
    permanent_address: string;
    boys_count: number;
    girls_count: number;
    elders_count: number;
    payment_status: PaymentStatus;
    payment_amount: number | null;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((row) => ({
    address: row.permanent_address,
    age: row.age,
    boys: row.boys_count,
    createdAt: row.created_at,
    dob: null,
    education: row.education_level,
    elderly: row.elders_count,
    fullName: row.full_name,
    girls: row.girls_count,
    mobileNumber: row.mobile_number,
    paymentAmount: row.payment_amount === null ? null : Number(row.payment_amount),
    paymentReference: null,
    paymentStatus: row.payment_status,
    paymentUtr: null,
    registrationId: row.registration_id,
    updatedAt: row.updated_at
  }));
}

function countRows(db: Database, sql: string): number {
  return Number(db.prepare(sql).pluck().get() ?? 0);
}

function insertFailureAudit(params: {
  admin: LocalAdminIdentity;
  db: Database;
  expectedExportedRows: number | null;
  filename: string | null;
  failureCode: string;
  ipAddress: string | null;
}): void {
  insertAuditLog({
    action: "EXPORT_AND_CLEAR_DATABASE",
    administratorEmail: params.admin.email,
    db: params.db,
    metadata: {
      csvFilename: params.filename,
      expectedExportedRows: params.expectedExportedRows,
      failureCode: params.failureCode,
      ipAddress: params.ipAddress,
      success: false,
      time: new Date().toISOString()
    }
  });
}

async function removeUploads(config: LocalPortalConfig, paths: string[]): Promise<void> {
  for (const path of paths) {
    await removeStoredUpload(config, path);
  }
}

export function handleAdminRegistrationExportRows(params: {
  request: IncomingMessage;
  response: ServerResponse;
  config: LocalPortalConfig;
  db: Database;
}): void {
  if (params.request.method !== "GET") {
    writeFailure(params.response, 405, "VALIDATION_ERROR", "यह HTTP method समर्थित नहीं है।");
    return;
  }

  if (!requireLocalAdmin(params.request, params.response, params.config)) {
    return;
  }

  writeSuccess(params.response, getExportRows(params.db));
}

export async function handleAdminDatabaseExportClear(params: {
  request: IncomingMessage;
  response: ServerResponse;
  config: LocalPortalConfig;
  db: Database;
}): Promise<void> {
  if (params.request.method !== "POST") {
    writeFailure(params.response, 405, "VALIDATION_ERROR", "यह HTTP method समर्थित नहीं है।");
    return;
  }

  const admin = requireLocalAdmin(params.request, params.response, params.config);

  if (!admin) {
    return;
  }

  if (!validateAdminStateChangingRequest({
    config: params.config,
    contentType: "json",
    request: params.request,
    response: params.response
  })) {
    return;
  }

  const ipAddress = getClientIp(params.request);
  let body: ExportClearRequestBody | null = null;

  try {
    body = validateRequestBody(getJsonRecord(await readJsonBody(params.request)));
  } catch {
    writeFailure(params.response, 400, "VALIDATION_ERROR", "अनुरोध मान्य नहीं है।");
    return;
  }

  if (!body) {
    insertFailureAudit({
      admin,
      db: params.db,
      expectedExportedRows: null,
      failureCode: "VALIDATION_ERROR",
      filename: null,
      ipAddress
    });
    writeFailure(params.response, 400, "VALIDATION_ERROR", "Export और clear अनुरोध मान्य नहीं है।");
    return;
  }

  try {
    const clearDatabase = params.db.transaction(() => {
      const exportedRows = countRows(params.db, "SELECT COUNT(*) FROM registrations");

      if (exportedRows !== body.expectedExportedRows) {
        throw new Error("EXPORT_ROW_COUNT_CHANGED");
      }

      const uploadPaths = [
        ...(params.db.prepare(`
          SELECT applicant_photo_path AS path
          FROM registrations
          WHERE applicant_photo_path IS NOT NULL AND applicant_photo_path <> ''
        `).all() as StoredUploadPathRow[]),
        ...(params.db.prepare(`
          SELECT storage_path AS path
          FROM payment_proofs
          WHERE storage_path IS NOT NULL AND storage_path <> ''
        `).all() as StoredUploadPathRow[])
      ].map((row) => row.path);
      const paymentProofRows = countRows(params.db, "SELECT COUNT(*) FROM payment_proofs");
      const relatedAuditRows = countRows(
        params.db,
        "SELECT COUNT(*) FROM admin_audit_logs WHERE registration_record_id IN (SELECT id FROM registrations)"
      );
      const now = new Date().toISOString();

      params.db.prepare(`
        DELETE FROM admin_audit_logs
        WHERE registration_record_id IN (SELECT id FROM registrations)
      `).run();
      params.db.prepare("DELETE FROM payment_proofs").run();
      params.db.prepare("DELETE FROM registrations").run();
      params.db.prepare("DELETE FROM registration_counters").run();

      insertAuditLog({
        action: "EXPORT_AND_CLEAR_DATABASE",
        administratorEmail: admin.email,
        db: params.db,
        metadata: {
          counterReset: true,
          csvFilename: body.filename,
          deletedPaymentProofs: paymentProofRows,
          deletedRelatedAuditLogs: relatedAuditRows,
          deletedRows: exportedRows,
          exportedRows,
          ipAddress,
          success: true,
          time: now
        }
      });

      return {
        deletedRows: exportedRows,
        exportedRows,
        filename: body.filename,
        uploadPaths
      };
    });
    const result = clearDatabase();

    await removeUploads(params.config, result.uploadPaths);

    writeSuccess<ExportClearResult>(params.response, {
      deletedRows: result.deletedRows,
      exportedRows: result.exportedRows,
      filename: result.filename,
      success: true
    });
  } catch (error) {
    const failureCode =
      error instanceof Error && error.message === "EXPORT_ROW_COUNT_CHANGED"
        ? "EXPORT_ROW_COUNT_CHANGED"
        : "EXPORT_CLEAR_FAILED";

    insertFailureAudit({
      admin,
      db: params.db,
      expectedExportedRows: body.expectedExportedRows,
      failureCode,
      filename: body.filename,
      ipAddress
    });
    writeFailure(
      params.response,
      failureCode === "EXPORT_ROW_COUNT_CHANGED" ? 409 : 500,
      failureCode,
      failureCode === "EXPORT_ROW_COUNT_CHANGED"
        ? "CSV बनाते समय डेटाबेस बदल गया। कृपया फिर से निर्यात करें।"
        : "डेटाबेस export और clear कार्रवाई पूरी नहीं हो सकी।"
    );
  }
}
