// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { Database } from "better-sqlite3";
import type { IncomingMessage, ServerResponse } from "node:http";
import { insertAuditLog } from "./local-portal.audit";
import { requireLocalAdmin, validateAdminStateChangingRequest } from "./local-portal.admin";
import { validateAndStoreImage, parseMultipartForm, removeStoredUpload } from "./local-portal.files";
import { hasRequestedWithHeader, writeFailure, writeSuccess } from "./local-portal.responses";
import { createSignedFileUrl } from "./local-portal.tokens";
import type { LocalPortalConfig, PaymentSettingsRow } from "./local-portal.types";

const qrMaxBytes = 3 * 1024 * 1024;
const signedQrTtlSeconds = 15 * 60;
const existingQrCodeReference = "existing-qr-code";

function getSettingsRow(db: Database): PaymentSettingsRow {
  return db.prepare("SELECT * FROM payment_settings WHERE id = 1").get() as PaymentSettingsRow;
}

function normalizeNullableText(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed ? trimmed : null;
}

function parseBoolean(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

function parseAmount(value: string | undefined): number | null {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return null;
  }

  const amount = Number(trimmed);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

function mapAdminSettings(row: PaymentSettingsRow, config: LocalPortalConfig) {
  const qrCodeSignedUrl = config.state === "configured" && row.qr_code_path
    ? createSignedFileUrl({
        path: row.qr_code_path,
        purpose: "qr",
        secret: config.signingSecret,
        ttlSeconds: signedQrTtlSeconds
      })
    : null;

  return {
    amount: row.amount,
    dataSource: "local-dev" as const,
    instructions: row.instructions,
    localTestingBadge: "स्थानीय परीक्षण डेटा",
    payeeName: row.payee_name,
    paymentDeadline: row.payment_deadline,
    paymentEnabled: Boolean(row.payment_enabled),
    paymentTitle: row.payment_title,
    publicContact: row.public_contact,
    qrCodePath: row.qr_code_path ? existingQrCodeReference : null,
    qrCodeSignedUrl,
    updatedAt: row.updated_at,
    upiId: row.upi_id
  };
}

function mapPublicSettings(row: PaymentSettingsRow, config: LocalPortalConfig) {
  const paymentEnabled = Boolean(row.payment_enabled);
  const qrCodeSignedUrl = config.state === "configured" && paymentEnabled && row.qr_code_path
    ? createSignedFileUrl({
        path: row.qr_code_path,
        purpose: "qr",
        secret: config.signingSecret,
        ttlSeconds: signedQrTtlSeconds
      })
    : null;

  return {
    amount: paymentEnabled ? row.amount : null,
    instructions: paymentEnabled ? row.instructions : null,
    payeeName: paymentEnabled ? row.payee_name : null,
    paymentDeadline: paymentEnabled ? row.payment_deadline : null,
    paymentEnabled,
    paymentTitle: paymentEnabled ? row.payment_title : null,
    publicContact: paymentEnabled ? row.public_contact : null,
    qrCodeUrl: qrCodeSignedUrl,
    updatedAt: row.updated_at,
    upiId: paymentEnabled ? row.upi_id : null
  };
}

function validateEnabledSettings(params: {
  qrCodePath: string | null;
  upiId: string | null;
  payeeName: string | null;
  amount: number | null;
  paymentTitle: string | null;
  instructions: string | null;
  publicContact: string | null;
}): string | null {
  if (!params.qrCodePath) {
    return "QR कोड आवश्यक है।";
  }

  if (!params.upiId || !/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/.test(params.upiId)) {
    return "मान्य UPI आईडी आवश्यक है।";
  }

  if (!params.payeeName || params.payeeName.length > 100) {
    return "प्राप्तकर्ता का नाम आवश्यक है।";
  }

  if (params.amount === null || params.amount <= 0 || params.amount > 100000 || !/^\d+(\.\d{1,2})?$/.test(String(params.amount))) {
    return "मान्य पंजीकरण शुल्क आवश्यक है।";
  }

  if (!params.paymentTitle || params.paymentTitle.length > 120) {
    return "भुगतान शीर्षक आवश्यक है।";
  }

  if (!params.instructions || params.instructions.length > 1000) {
    return "भुगतान निर्देश आवश्यक हैं।";
  }

  if (!params.publicContact || params.publicContact.length > 200) {
    return "सार्वजनिक सहायता संपर्क आवश्यक है।";
  }

  return null;
}

export function handleAdminPaymentSettingsGet(params: {
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

  writeSuccess(params.response, mapAdminSettings(getSettingsRow(params.db), params.config));
}

export async function handleAdminPaymentSettingsPut(params: {
  request: IncomingMessage;
  response: ServerResponse;
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
    contentType: "multipart",
    request: params.request,
    response: params.response
  })) {
    return;
  }

  const current = getSettingsRow(params.db);
  let uploadedQrPath: string | null = null;

  try {
    const form = await parseMultipartForm(params.request, {
      maxFileBytes: qrMaxBytes,
      maxTotalBytes: qrMaxBytes + 128 * 1024
    });
    const fields = form.fields;
    const paymentEnabled = parseBoolean(fields.get("paymentEnabled"));
    const existingQrCodePath = normalizeNullableText(fields.get("existingQrCodePath"));
    let qrCodePath = existingQrCodePath ? current.qr_code_path : null;
    let qrCodeMimeType = existingQrCodePath ? current.qr_code_mime_type : null;
    let qrCodeSizeBytes = existingQrCodePath ? current.qr_code_size_bytes : null;

    if (form.files.has("qrCodeFile")) {
      const storedQr = await validateAndStoreImage({
        category: "payment-qr-codes",
        config: params.config,
        file: form.files.get("qrCodeFile"),
        maxBytes: qrMaxBytes
      });
      uploadedQrPath = storedQr.relativePath;
      qrCodePath = storedQr.relativePath;
      qrCodeMimeType = storedQr.mimeType;
      qrCodeSizeBytes = storedQr.sizeBytes;
    }

    const upiId = normalizeNullableText(fields.get("upiId"));
    const payeeName = normalizeNullableText(fields.get("payeeName"));
    const amount = parseAmount(fields.get("registrationFee"));
    const paymentTitle = normalizeNullableText(fields.get("paymentTitle"));
    const instructions = normalizeNullableText(fields.get("paymentInstructions"));
    const publicContact = normalizeNullableText(fields.get("publicSupportContact"));
    const paymentDeadline = normalizeNullableText(fields.get("paymentDeadline"));

    const validationError = paymentEnabled
      ? validateEnabledSettings({
          amount,
          instructions,
          payeeName,
          paymentTitle,
          publicContact,
          qrCodePath,
          upiId
        })
      : null;

    if (validationError) {
      await removeStoredUpload(params.config, uploadedQrPath);
      writeFailure(params.response, 400, "VALIDATION_ERROR", validationError);
      return;
    }

    const now = new Date().toISOString();
    const save = params.db.transaction(() => {
      params.db.prepare(`
        UPDATE payment_settings
        SET
          payment_enabled = ?,
          qr_code_path = ?,
          qr_code_mime_type = ?,
          qr_code_size_bytes = ?,
          upi_id = ?,
          payee_name = ?,
          amount = ?,
          payment_title = ?,
          instructions = ?,
          public_contact = ?,
          payment_deadline = ?,
          updated_at = ?
        WHERE id = 1
      `).run(
        paymentEnabled ? 1 : 0,
        qrCodePath,
        qrCodeMimeType,
        qrCodeSizeBytes,
        upiId,
        payeeName,
        amount,
        paymentTitle,
        instructions,
        publicContact,
        paymentDeadline,
        now
      );
      insertAuditLog({
        action: "payment_settings_updated",
        administratorEmail: admin.email,
        db: params.db,
        metadata: {
          local: true,
          paymentEnabled
        },
        previousValue: {
          paymentEnabled: Boolean(current.payment_enabled),
          hadQrCode: Boolean(current.qr_code_path)
        },
        newValue: {
          paymentEnabled,
          hasQrCode: Boolean(qrCodePath)
        }
      });
    });

    save();

    if (current.qr_code_path && current.qr_code_path !== qrCodePath) {
      await removeStoredUpload(params.config, current.qr_code_path);
    }

    writeSuccess(params.response, {
      ...mapAdminSettings(getSettingsRow(params.db), params.config),
      saveMessage: "भुगतान सेटिंग्स स्थानीय परीक्षण डेटाबेस में सहेजी गई हैं।"
    });
  } catch (error) {
    await removeStoredUpload(params.config, uploadedQrPath);
    writeFailure(
      params.response,
      error instanceof Error && error.message === "FILE_TOO_LARGE" ? 413 : 400,
      error instanceof Error && error.message === "FILE_TOO_LARGE" ? "FILE_TOO_LARGE" : "INVALID_FILE",
      error instanceof Error && error.message === "FILE_TOO_LARGE"
        ? "QR कोड फाइल बहुत बड़ी है।"
        : "QR कोड या भुगतान सेटिंग्स मान्य नहीं हैं।"
    );
  }
}

export function handlePublicPaymentSettingsGet(params: {
  request: IncomingMessage;
  response: ServerResponse;
  config: LocalPortalConfig;
  db: Database;
}): void {
  if (params.request.method !== "GET") {
    writeFailure(params.response, 405, "VALIDATION_ERROR", "यह HTTP method समर्थित नहीं है।");
    return;
  }

  writeSuccess(params.response, mapPublicSettings(getSettingsRow(params.db), params.config));
}

export function assertAdminHeaderForTests(request: IncomingMessage): boolean {
  return hasRequestedWithHeader(request);
}
