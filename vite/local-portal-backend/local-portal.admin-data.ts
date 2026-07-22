// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { Database } from "better-sqlite3";
import type { IncomingMessage, ServerResponse } from "node:http";
import { insertAuditLog } from "./local-portal.audit";
import { requireLocalAdmin, validateAdminStateChangingRequest } from "./local-portal.admin";
import { getRegistrationById } from "./local-portal.registration";
import { getJsonRecord, hasJsonContentType, readJsonBody, writeFailure, writeSuccess } from "./local-portal.responses";
import { createSignedFileUrl } from "./local-portal.tokens";
import type {
  LocalPortalConfig,
  PaymentProofRow,
  PaymentStatus,
  RegistrationRow,
  RegistrationStatus
} from "./local-portal.types";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapListRow(row: RegistrationRow) {
  return {
    age: row.age,
    createdAt: row.created_at,
    educationLevel: row.education_level,
    fullName: row.full_name,
    paymentStatus: row.payment_status,
    registrationId: row.registration_id,
    registrationStatus: row.registration_status,
    submittedAt: row.payment_submitted_at,
    totalFamilyMembers: row.total_family_members,
    updatedAt: row.updated_at
  };
}

function getPaymentProofs(db: Database, registrationRecordId: string): PaymentProofRow[] {
  return db.prepare(`
    SELECT * FROM payment_proofs
    WHERE registration_record_id = ?
    ORDER BY submitted_at DESC
  `).all(registrationRecordId) as PaymentProofRow[];
}

function mapDetails(params: {
  registration: RegistrationRow;
  proofs: PaymentProofRow[];
  config: LocalPortalConfig;
}) {
  return {
    adminNotes: params.registration.admin_notes,
    age: params.registration.age,
    applicantPhotoPath: "",
    applicantPhotoSignedUrl: params.config.state === "configured"
      ? createSignedFileUrl({
          path: params.registration.applicant_photo_path,
          purpose: "admin-file",
          secret: params.config.signingSecret,
          ttlSeconds: 10 * 60
        })
      : null,
    approvedAt: params.registration.approved_at,
    archivedAt: params.registration.archived_at,
    boysCount: params.registration.boys_count,
    createdAt: params.registration.created_at,
    educationDetails: params.registration.education_details,
    educationLevel: params.registration.education_level,
    eldersCount: params.registration.elders_count,
    fullName: params.registration.full_name,
    girlsCount: params.registration.girls_count,
    mobileNumber: params.registration.mobile_number,
    paymentProofs: params.proofs.map((proof) => ({
      id: proof.id,
      mimeType: proof.mime_type,
      originalFilename: proof.original_filename,
      proofStatus: proof.proof_status,
      publicRejectionMessage: proof.public_rejection_message,
      reviewedAt: proof.reviewed_at,
      signedUrl: params.config.state === "configured"
        ? createSignedFileUrl({
            path: proof.storage_path,
            purpose: "admin-file",
            secret: params.config.signingSecret,
            ttlSeconds: 10 * 60
          })
        : null,
      sizeBytes: proof.size_bytes,
      storagePath: "",
      submittedAt: proof.submitted_at
    })),
    paymentResubmissionAllowed: Boolean(params.registration.payment_resubmission_allowed),
    paymentStatus: params.registration.payment_status,
    paymentSubmittedAt: params.registration.payment_submitted_at,
    paymentVerifiedAt: params.registration.payment_verified_at,
    permanentAddress: params.registration.permanent_address,
    publicRejectionMessage: params.registration.public_rejection_message,
    registrationId: params.registration.registration_id,
    registrationStatus: params.registration.registration_status,
    rejectedAt: params.registration.rejected_at,
    reviewedAt: params.registration.reviewed_at,
    totalFamilyMembers: params.registration.total_family_members,
    updatedAt: params.registration.updated_at,
    version: params.registration.version
  };
}

export function handleAdminDashboardMetrics(params: {
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

  const scalar = (sql: string, value?: unknown) => {
    const statement = params.db.prepare(sql).pluck();
    const result = value === undefined ? statement.get() : statement.get(value);

    return Number((result as number | undefined) ?? 0);
  };

  writeSuccess(params.response, {
    approvedRegistrations: scalar("SELECT COUNT(*) FROM registrations WHERE registration_status = 'approved'"),
    awaitingPayment: scalar("SELECT COUNT(*) FROM registrations WHERE registration_status = 'awaiting_payment'"),
    pendingVerification: scalar("SELECT COUNT(*) FROM registrations WHERE payment_status = 'pending_verification'"),
    rejectedRegistrations: scalar("SELECT COUNT(*) FROM registrations WHERE registration_status = 'rejected'"),
    submittedToday: scalar("SELECT COUNT(*) FROM registrations WHERE substr(created_at, 1, 10) = ?", todayIsoDate()),
    totalRegistrations: scalar("SELECT COUNT(*) FROM registrations")
  });
}

export function handleAdminRegistrationList(params: {
  request: IncomingMessage;
  response: ServerResponse;
  url: URL;
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

  const search = params.url.searchParams.get("search")?.trim() ?? "";
  const registrationStatus = params.url.searchParams.get("registrationStatus") ?? "";
  const paymentStatus = params.url.searchParams.get("paymentStatus") ?? "";
  const createdOn = params.url.searchParams.get("createdOn") ?? "";
  const sort = params.url.searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, Number(params.url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.url.searchParams.get("pageSize") ?? 20)));
  const whereParts: string[] = [];
  const values: unknown[] = [];

  if (search) {
    whereParts.push("(registration_id LIKE ? OR full_name LIKE ?)");
    values.push(`%${search}%`, `%${search}%`);
  }

  if (registrationStatus) {
    whereParts.push("registration_status = ?");
    values.push(registrationStatus);
  }

  if (paymentStatus) {
    whereParts.push("payment_status = ?");
    values.push(paymentStatus);
  }

  if (createdOn) {
    whereParts.push("substr(created_at, 1, 10) = ?");
    values.push(createdOn);
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
  const totalItems = Number(params.db.prepare(`SELECT COUNT(*) FROM registrations ${whereSql}`).pluck().get(...values) ?? 0);
  const rows = params.db.prepare(`
    SELECT * FROM registrations
    ${whereSql}
    ORDER BY created_at ${sort === "oldest" ? "ASC" : "DESC"}
    LIMIT ? OFFSET ?
  `).all(...values, pageSize, (page - 1) * pageSize) as RegistrationRow[];

  writeSuccess(params.response, {
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
    },
    rows: rows.map(mapListRow)
  });
}

export function handleAdminRegistrationDetails(params: {
  request: IncomingMessage;
  response: ServerResponse;
  registrationId: string;
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

  const registration = getRegistrationById(params.db, params.registrationId);

  if (!registration) {
    writeSuccess(params.response, null);
    return;
  }

  writeSuccess(params.response, mapDetails({
    config: params.config,
    proofs: getPaymentProofs(params.db, registration.id),
    registration
  }));
}

function assertVersion(registration: RegistrationRow, expectedVersion: number): boolean {
  return registration.version === expectedVersion;
}

export async function handleAdminRegistrationAction(params: {
  request: IncomingMessage;
  response: ServerResponse;
  registrationId: string;
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

  let body: Record<string, unknown>;
  try {
    body = getJsonRecord(await readJsonBody(params.request));
  } catch {
    writeFailure(params.response, 400, "VALIDATION_ERROR", "प्रशासनिक कार्रवाई अनुरोध मान्य नहीं है।");
    return;
  }

  const registration = getRegistrationById(params.db, params.registrationId);

  if (!registration) {
    writeFailure(params.response, 404, "NOT_FOUND", "पंजीकरण रिकॉर्ड नहीं मिला।");
    return;
  }

  const expectedVersion = Number(body.expectedVersion);
  const action = String(body.action ?? "");
  const publicMessage = typeof body.publicMessage === "string" ? body.publicMessage.trim() : null;

  if (!assertVersion(registration, expectedVersion)) {
    writeFailure(params.response, 409, "CONFLICT", "यह रिकॉर्ड किसी अन्य प्रशासनिक कार्रवाई से बदल चुका है। कृपया नवीनतम जानकारी पुनः लोड करें।");
    return;
  }

  const now = new Date().toISOString();
  let updates: Partial<Record<keyof RegistrationRow, unknown>> = {};
  let auditAction = "";

  if (action === "mark_under_review") {
    updates = {
      registration_status: "under_review" satisfies RegistrationStatus,
      reviewed_at: now
    };
    auditAction = "registration_marked_under_review";
  } else if (action === "verify_payment") {
    if (registration.payment_status !== "pending_verification") {
      writeFailure(params.response, 409, "CONFLICT", "सत्यापन के लिए भुगतान प्रमाण लंबित होना चाहिए।");
      return;
    }
    updates = {
      payment_status: "verified" satisfies PaymentStatus,
      payment_verified_at: now,
      public_rejection_message: null
    };
    auditAction = "payment_verified";
  } else if (action === "reject_payment") {
    if (!publicMessage || publicMessage.length > 500) {
      writeFailure(params.response, 400, "VALIDATION_ERROR", "भुगतान अस्वीकृति का सार्वजनिक कारण आवश्यक है।");
      return;
    }
    updates = {
      payment_status: "rejected" satisfies PaymentStatus,
      public_rejection_message: publicMessage
    };
    auditAction = "payment_rejected";
  } else if (action === "approve_registration") {
    if (registration.payment_status !== "verified" || registration.registration_status === "archived") {
      writeFailure(params.response, 409, "CONFLICT", "पंजीकरण स्वीकृति से पहले भुगतान सत्यापित होना चाहिए।");
      return;
    }
    updates = {
      approved_at: now,
      payment_resubmission_allowed: 0,
      registration_status: "approved" satisfies RegistrationStatus
    };
    auditAction = "registration_approved";
  } else if (action === "reject_registration") {
    if (!publicMessage || publicMessage.length > 500) {
      writeFailure(params.response, 400, "VALIDATION_ERROR", "पंजीकरण अस्वीकृति का सार्वजनिक कारण आवश्यक है।");
      return;
    }
    updates = {
      public_rejection_message: publicMessage,
      rejected_at: now,
      registration_status: "rejected" satisfies RegistrationStatus
    };
    auditAction = "registration_rejected";
  } else if (action === "archive_registration") {
    updates = {
      archived_at: now,
      registration_status: "archived" satisfies RegistrationStatus
    };
    auditAction = "registration_archived";
  } else if (action === "enable_payment_resubmission") {
    if (registration.payment_status !== "rejected") {
      writeFailure(params.response, 409, "CONFLICT", "भुगतान पुनः जमा केवल अस्वीकृत भुगतान पर सक्षम हो सकता है।");
      return;
    }
    updates = {
      payment_resubmission_allowed: 1
    };
    auditAction = "payment_resubmission_enabled";
  } else {
    writeFailure(params.response, 400, "VALIDATION_ERROR", "प्रशासनिक कार्रवाई मान्य नहीं है।");
    return;
  }

  const updateKeys = Object.keys(updates);
  const updateSql = updateKeys.map((key) => `${key} = ?`).join(", ");
  const updateValues = updateKeys.map((key) => updates[key as keyof RegistrationRow]);

  const save = params.db.transaction(() => {
    params.db.prepare(`
      UPDATE registrations
      SET ${updateSql}, updated_at = ?, version = version + 1
      WHERE id = ?
    `).run(...updateValues, now, registration.id);

    if (action === "verify_payment" || action === "reject_payment") {
      const latestProof = params.db.prepare(`
        SELECT id FROM payment_proofs
        WHERE registration_record_id = ?
        ORDER BY submitted_at DESC
        LIMIT 1
      `).get(registration.id) as { id: string } | undefined;

      if (latestProof) {
        params.db.prepare(`
          UPDATE payment_proofs
          SET proof_status = ?, public_rejection_message = ?, reviewed_at = ?
          WHERE id = ?
        `).run(
          action === "verify_payment" ? "verified" : "rejected",
          action === "reject_payment" ? publicMessage : null,
          now,
          latestProof.id
        );
      }
    }

    insertAuditLog({
      action: auditAction,
      administratorEmail: admin.email,
      db: params.db,
      newValue: {
        action,
        publicMessage: publicMessage ? "[public-message-provided]" : null
      },
      previousValue: {
        paymentStatus: registration.payment_status,
        registrationStatus: registration.registration_status
      },
      registrationId: registration.registration_id,
      registrationRecordId: registration.id
    });
  });

  save();

  const updated = getRegistrationById(params.db, params.registrationId);

  if (!updated) {
    writeFailure(params.response, 500, "INTERNAL_ERROR", "अपडेट के बाद रिकॉर्ड प्राप्त नहीं हो सका।");
    return;
  }

  writeSuccess(params.response, mapDetails({
    config: params.config,
    proofs: getPaymentProofs(params.db, updated.id),
    registration: updated
  }));
}

export async function handleAdminNotesUpdate(params: {
  request: IncomingMessage;
  response: ServerResponse;
  registrationId: string;
  config: LocalPortalConfig;
  db: Database;
}): Promise<void> {
  if (params.request.method !== "PUT") {
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

  const body = getJsonRecord(await readJsonBody(params.request));
  const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes : "";
  const expectedVersion = Number(body.expectedVersion);
  const registration = getRegistrationById(params.db, params.registrationId);

  if (!registration) {
    writeFailure(params.response, 404, "NOT_FOUND", "पंजीकरण रिकॉर्ड नहीं मिला।");
    return;
  }

  if (!assertVersion(registration, expectedVersion)) {
    writeFailure(params.response, 409, "CONFLICT", "यह रिकॉर्ड किसी अन्य प्रशासनिक कार्रवाई से बदल चुका है। कृपया नवीनतम जानकारी पुनः लोड करें।");
    return;
  }

  if (adminNotes.length > 5000) {
    writeFailure(params.response, 400, "VALIDATION_ERROR", "प्रशासनिक टिप्पणी बहुत लंबी है।");
    return;
  }

  const now = new Date().toISOString();
  params.db.transaction(() => {
    params.db.prepare(`
      UPDATE registrations
      SET admin_notes = ?, updated_at = ?, version = version + 1
      WHERE id = ?
    `).run(adminNotes, now, registration.id);
    insertAuditLog({
      action: "admin_note_updated",
      administratorEmail: admin.email,
      db: params.db,
      metadata: {
        noteLength: adminNotes.length
      },
      registrationId: registration.registration_id,
      registrationRecordId: registration.id
    });
  })();

  const updated = getRegistrationById(params.db, params.registrationId);

  writeSuccess(params.response, mapDetails({
    config: params.config,
    proofs: updated ? getPaymentProofs(params.db, updated.id) : [],
    registration: updated ?? registration
  }));
}

export function handleAdminAuditLogs(params: {
  request: IncomingMessage;
  response: ServerResponse;
  url: URL;
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

  const action = params.url.searchParams.get("action")?.trim() ?? "";
  const registrationId = params.url.searchParams.get("registrationId")?.trim().toUpperCase() ?? "";
  const from = params.url.searchParams.get("from") ?? "";
  const to = params.url.searchParams.get("to") ?? "";
  const page = Math.max(1, Number(params.url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.url.searchParams.get("pageSize") ?? 20)));
  const whereParts: string[] = [];
  const values: unknown[] = [];

  if (action) {
    whereParts.push("action = ?");
    values.push(action);
  }

  if (registrationId) {
    whereParts.push("registration_id = ?");
    values.push(registrationId);
  }

  if (from) {
    whereParts.push("created_at >= ?");
    values.push(`${from}T00:00:00.000Z`);
  }

  if (to) {
    whereParts.push("created_at <= ?");
    values.push(`${to}T23:59:59.999Z`);
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
  const totalItems = Number(params.db.prepare(`SELECT COUNT(*) FROM admin_audit_logs ${whereSql}`).pluck().get(...values) ?? 0);
  const rows = params.db.prepare(`
    SELECT id, administrator_email, action, registration_id, metadata, created_at
    FROM admin_audit_logs
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...values, pageSize, (page - 1) * pageSize) as Array<{
    id: string;
    administrator_email: string;
    action: string;
    registration_id: string | null;
    metadata: string | null;
    created_at: string;
  }>;

  writeSuccess(params.response, {
    rows: rows.map((row) => ({
      action: row.action,
      adminUserId: row.administrator_email,
      createdAt: row.created_at,
      id: row.id,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      registrationId: row.registration_id
    })),
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
  });
}
