// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { Database } from "better-sqlite3";
import type { IncomingMessage, ServerResponse } from "node:http";
import { parseMultipartForm, removeStoredUpload, validateAndStoreImage } from "./local-portal.files";
import { getRegistrationById } from "./local-portal.registration";
import { hasMultipartContentType, writeFailure, writeSuccess } from "./local-portal.responses";
import { createAcknowledgementDownloadUrl, hashPaymentAccessToken } from "./local-portal.tokens";
import type { LocalPortalConfig, RegistrationRow, StoredUpload } from "./local-portal.types";

const proofMaxBytes = 5 * 1024 * 1024;

function getAcknowledgementNumber(registrationId: string): string {
  return `ACK-${registrationId}-${Date.now().toString(36).toUpperCase()}`;
}

function canSubmitPaymentProof(registration: RegistrationRow): boolean {
  if (registration.payment_status === "not_submitted") {
    return true;
  }

  return registration.payment_status === "rejected" && Boolean(registration.payment_resubmission_allowed);
}

export async function handlePaymentProofSubmit(params: {
  request: IncomingMessage;
  response: ServerResponse;
  config: LocalPortalConfig;
  db: Database;
}): Promise<void> {
  if (params.request.method !== "POST") {
    writeFailure(params.response, 405, "VALIDATION_ERROR", "यह HTTP method समर्थित नहीं है।");
    return;
  }

  if (!hasMultipartContentType(params.request)) {
    writeFailure(params.response, 415, "VALIDATION_ERROR", "अनुरोध content type समर्थित नहीं है।");
    return;
  }

  let storedProof: StoredUpload | null = null;

  try {
    const form = await parseMultipartForm(params.request, {
      maxFileBytes: proofMaxBytes,
      maxTotalBytes: proofMaxBytes + 128 * 1024
    });
    const registrationId = form.fields.get("registrationId")?.trim().toUpperCase() ?? "";
    const paymentAccessToken = form.fields.get("paymentAccessToken") ?? "";
    const declarationAccepted = form.fields.get("declarationAccepted") === "true";

    if (!/^DS-\d{4}-\d{6}$/.test(registrationId) || !paymentAccessToken || !declarationAccepted) {
      writeFailure(params.response, 400, "VALIDATION_ERROR", "भुगतान प्रमाण अनुरोध मान्य नहीं है।");
      return;
    }

    const registration = getRegistrationById(params.db, registrationId);

    if (!registration) {
      writeFailure(params.response, 404, "NOT_FOUND", "पंजीकरण रिकॉर्ड नहीं मिला।");
      return;
    }

    if (registration.payment_access_token_expires_at <= new Date().toISOString()) {
      writeFailure(params.response, 403, "TOKEN_EXPIRED", "भुगतान प्रमाण अनुमति समाप्त हो गई है।");
      return;
    }

    if (registration.payment_access_token_hash !== hashPaymentAccessToken(paymentAccessToken)) {
      writeFailure(params.response, 403, "INVALID_PAYMENT_TOKEN", "भुगतान प्रमाण अनुमति मान्य नहीं है।");
      return;
    }

    if (!canSubmitPaymentProof(registration)) {
      writeFailure(params.response, 409, "PAYMENT_SUBMISSION_NOT_ALLOWED", "भुगतान प्रमाण दोबारा जमा करने की अनुमति उपलब्ध नहीं है।");
      return;
    }

    storedProof = await validateAndStoreImage({
      category: "payment-proofs",
      config: params.config,
      file: form.files.get("paymentScreenshot"),
      maxBytes: proofMaxBytes
    });

    const now = new Date().toISOString();
    const acknowledgementNumber = getAcknowledgementNumber(registrationId);
    const save = params.db.transaction(() => {
      params.db.prepare(`
        INSERT INTO payment_proofs (
          id,
          registration_record_id,
          storage_path,
          original_filename,
          mime_type,
          size_bytes,
          proof_status,
          acknowledgement_number,
          submitted_at,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'pending_verification', ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        registration.id,
        storedProof?.relativePath,
        form.files.get("paymentScreenshot")?.originalFilename ?? null,
        storedProof?.mimeType,
        storedProof?.sizeBytes,
        acknowledgementNumber,
        now,
        now
      );
      params.db.prepare(`
        UPDATE registrations
        SET
          registration_status = 'submitted',
          payment_status = 'pending_verification',
          payment_resubmission_allowed = 0,
          public_rejection_message = NULL,
          payment_submitted_at = ?,
          updated_at = ?,
          version = version + 1
        WHERE id = ?
      `).run(now, now, registration.id);
    });

    save();

    writeSuccess(params.response, {
      acknowledgementAvailable: true,
      acknowledgementDownloadUrl: createAcknowledgementDownloadUrl({
        acknowledgementNumber,
        registrationId,
        secret: params.config.state === "configured" ? params.config.signingSecret : "",
        ttlSeconds: 30 * 60
      }),
      acknowledgementNumber,
      paymentStatus: "pending_verification" as const,
      registrationId,
      registrationStatus: "submitted" as const,
      submittedAt: now
    });
  } catch (error) {
    await removeStoredUpload(params.config, storedProof?.relativePath ?? null);
    writeFailure(
      params.response,
      error instanceof Error && error.message === "FILE_TOO_LARGE" ? 413 : 400,
      error instanceof Error && error.message === "FILE_TOO_LARGE" ? "FILE_TOO_LARGE" : "INVALID_FILE",
      error instanceof Error && error.message === "FILE_TOO_LARGE"
        ? "भुगतान प्रमाण फाइल बहुत बड़ी है।"
        : "भुगतान प्रमाण फाइल मान्य नहीं है।"
    );
  }
}
