// SERVER-SIDE DEVELOPMENT CODE ONLY

import PDFDocument from "pdfkit";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import type { Database } from "better-sqlite3";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getUploadAbsolutePath } from "./local-portal.files";
import { getRegistrationById } from "./local-portal.registration";
import { writeFailure } from "./local-portal.responses";
import { hashPaymentAccessToken, verifySignedPortalToken } from "./local-portal.tokens";
import type { LocalPortalConfig, PaymentProofRow, PaymentSettingsRow, RegistrationRow } from "./local-portal.types";

const colors = {
  border: "#E8D8CA",
  brown: "#4B362C",
  cream: "#FFF7EA",
  maroon: "#5A1722",
  muted: "#75665D",
  white: "#FFFFFF"
};

const educationLabels: Record<string, string> = {
  diploma: "Diploma",
  graduate: "Graduate",
  higher_secondary: "Higher secondary",
  iti: "ITI",
  middle: "Middle school",
  no_formal_education: "No formal education",
  other: "Other",
  phd: "PhD",
  post_graduate: "Post graduate",
  primary: "Primary"
};

type DetailRow = {
  label: string;
  value: string | number | null | undefined;
};

function getSingleHeaderValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatAmount(value: unknown): string {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Not configured";
  }

  return `INR ${amount.toFixed(2)}`;
}

function normalizeValue(value: string | number | null | undefined): string {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "Not available";
  }

  const text = value?.toString().trim() ?? "";

  return text || "Not available";
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return `${new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata"
  }).format(date)} IST`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Not configured";
  }

  const date = new Date(`${value}T00:00:00.000+05:30`);

  if (Number.isNaN(date.getTime())) {
    return "Not configured";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata"
  }).format(date);
}

function formatFileSize(value: number | null | undefined): string {
  const size = Number(value);

  if (!Number.isFinite(size) || size < 0) {
    return "Not available";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatEducation(value: string, details: string | null): string {
  const label = educationLabels[value] ?? value.replace(/_/g, " ");

  return details ? `${label} - ${details}` : label;
}

function formatRegistrationStatus(value: string): string {
  const labels: Record<string, string> = {
    approved: "Approved",
    archived: "Archived",
    awaiting_payment: "Awaiting payment",
    rejected: "Rejected",
    submitted: "Submitted",
    under_review: "Under review"
  };

  return labels[value] ?? value;
}

function formatPaymentStatus(value: string): string {
  const labels: Record<string, string> = {
    not_submitted: "Payment proof not submitted",
    pending_verification: "Pending administrative verification",
    rejected: "Payment proof rejected",
    verified: "Payment verified"
  };

  return labels[value] ?? value;
}

function usableWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function ensureSpace(doc: PDFKit.PDFDocument, requiredHeight: number): void {
  if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function drawHeader(doc: PDFKit.PDFDocument, registrationId: string): void {
  doc.save();
  doc.rect(0, 0, doc.page.width, 118).fill(colors.maroon);
  doc
    .fillColor(colors.white)
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("Dhobi Samaj Registration Portal", doc.page.margins.left, 34, {
      width: usableWidth(doc)
    });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#F6EDE4")
    .text("Payment Proof Submission Acknowledgement", doc.page.margins.left, 60);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(colors.white)
    .text(`Registration ID: ${registrationId}`, doc.page.margins.left, 82);
  doc.restore();
  doc.y = 148;
}

function drawNotice(doc: PDFKit.PDFDocument, text: string): void {
  const x = doc.page.margins.left;
  const width = usableWidth(doc);
  const boxHeight = 52;

  ensureSpace(doc, boxHeight + 12);
  doc.save();
  doc.roundedRect(x, doc.y, width, boxHeight, 8).fillAndStroke(colors.cream, "#E8BE75");
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(colors.brown)
    .text(text, x + 12, doc.y + 10, {
      height: boxHeight - 20,
      lineGap: 2,
      width: width - 24
    });
  doc.restore();
  doc.y += boxHeight + 8;
}

function drawReportSection(doc: PDFKit.PDFDocument, title: string): void {
  ensureSpace(doc, 34);
  doc.moveDown(0.5);
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(colors.maroon)
    .text(title, {
      width: usableWidth(doc)
    });
  doc
    .moveTo(doc.page.margins.left, doc.y + 4)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 4)
    .strokeColor(colors.border)
    .lineWidth(0.8)
    .stroke();
  doc.moveDown(0.8);
}

function drawReportField(doc: PDFKit.PDFDocument, label: string, value: string | number | null | undefined): void {
  ensureSpace(doc, 40);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(colors.muted)
    .text(label.toUpperCase(), {
      width: usableWidth(doc)
    });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(colors.maroon)
    .text(normalizeValue(value), {
      lineGap: 1,
      width: usableWidth(doc)
    });
  doc.moveDown(0.35);
}

function drawReportFieldGroup(doc: PDFKit.PDFDocument, rows: DetailRow[]): void {
  rows.forEach((row) => drawReportField(doc, row.label, row.value));
}

function drawReportPaymentScreenshot(params: {
  config: LocalPortalConfig;
  doc: PDFKit.PDFDocument;
  proof: PaymentProofRow;
}): void {
  const { config, doc, proof } = params;
  const absolutePath = getUploadAbsolutePath(config, proof.storage_path);
  const canEmbedImage = proof.mime_type === "image/jpeg" || proof.mime_type === "image/png";

  ensureSpace(doc, 280);

  if (absolutePath && existsSync(absolutePath) && canEmbedImage) {
    try {
      doc.image(absolutePath, {
        align: "center",
        fit: [220, 280]
      });
      doc.moveDown(0.7);
    } catch {
      drawReportField(doc, "Screenshot preview", "The stored screenshot could not be embedded in this PDF.");
    }
  } else {
    drawReportField(
      doc,
      "Screenshot preview",
      canEmbedImage
        ? "The stored screenshot file was not available for embedding."
        : "The screenshot is stored securely, but this image format cannot be embedded in the PDF."
    );
  }

  drawReportFieldGroup(doc, [
    { label: "Original file name", value: proof.original_filename },
    { label: "File type", value: proof.mime_type },
    { label: "File size", value: formatFileSize(proof.size_bytes) },
    { label: "Submitted at", value: formatDateTime(proof.submitted_at) },
    { label: "Proof status", value: formatPaymentStatus(proof.proof_status) }
  ]);
}

function createReferenceCode(params: {
  acknowledgementNumber: string;
  registrationId: string;
  submittedAt: string;
}): string {
  return createHash("sha256")
    .update(`${params.registrationId}:${params.acknowledgementNumber}:${params.submittedAt}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
}

export function handleAcknowledgementPdf(params: {
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

  if (params.config.state !== "configured") {
    writeFailure(params.response, 503, "CONFIGURATION_REQUIRED", "स्थानीय backend कॉन्फ़िगरेशन अपूर्ण है।");
    return;
  }

  const match = params.url.pathname.match(/^\/api\/local-portal\/acknowledgements\/(DS-\d{4}-\d{6})\.pdf$/);
  const registrationId = match?.[1] ?? "";
  const token = params.url.searchParams.get("token");
  const payload = verifySignedPortalToken(token, params.config.signingSecret, "acknowledgement");

  if (!payload || payload.registrationId !== registrationId || !payload.acknowledgementNumber) {
    writeFailure(params.response, 403, "FORBIDDEN", "पावती डाउनलोड लिंक मान्य नहीं है।");
    return;
  }

  const registration = getRegistrationById(params.db, registrationId);

  if (!registration) {
    writeFailure(params.response, 404, "NOT_FOUND", "पंजीकरण रिकॉर्ड नहीं मिला।");
    return;
  }

  const paymentAccessToken = getSingleHeaderValue(params.request.headers["x-payment-access-token"]);

  if (
    !paymentAccessToken ||
    registration.payment_access_token_hash !== hashPaymentAccessToken(paymentAccessToken) ||
    registration.payment_access_token_expires_at <= new Date().toISOString()
  ) {
    writeFailure(params.response, 403, "FORBIDDEN", "पावती डाउनलोड अनुमति मान्य नहीं है।");
    return;
  }

  const proof = params.db.prepare(`
    SELECT * FROM payment_proofs
    WHERE registration_record_id = ? AND acknowledgement_number = ?
    LIMIT 1
  `).get(registration.id, payload.acknowledgementNumber) as PaymentProofRow | undefined;

  if (!proof || proof.proof_status !== "pending_verification") {
    writeFailure(params.response, 404, "NOT_FOUND", "पावती रिकॉर्ड नहीं मिला।");
    return;
  }

  const paymentSettings = params.db.prepare(`
    SELECT * FROM payment_settings WHERE id = 1
  `).get() as PaymentSettingsRow | undefined;
  const generatedAt = new Date().toISOString();
  const verificationCode = createReferenceCode({
    acknowledgementNumber: proof.acknowledgement_number,
    registrationId,
    submittedAt: proof.submitted_at
  });

  params.response.statusCode = 200;
  params.response.setHeader("Content-Type", "application/pdf");
  params.response.setHeader(
    "Content-Disposition",
    `attachment; filename="Acknowledgement_${registrationId}.pdf"`
  );
  params.response.setHeader("Cache-Control", "no-store");

  const doc = new PDFDocument({
    info: {
      Author: "Dhobi Samaj Registration Portal",
      Subject: "Payment proof submission acknowledgement",
      Title: `Payment Proof Submission Acknowledgement - ${registrationId}`
    },
    margin: 42,
    size: "A4"
  });

  doc.pipe(params.response);

  drawHeader(doc, registrationId);
  drawNotice(
    doc,
    "This acknowledgement confirms that a payment-proof image was submitted. It does not confirm that the payment has been received or verified."
  );

  drawReportSection(doc, "Acknowledgement summary");
  drawReportFieldGroup(doc, [
    { label: "Portal", value: "Dhobi Samaj Registration Portal" },
    { label: "Acknowledgement number", value: proof.acknowledgement_number },
    { label: "Registration ID", value: registration.registration_id },
    { label: "Applicant name", value: registration.full_name },
    { label: "Screenshot submitted at", value: formatDateTime(proof.submitted_at) },
    { label: "Generated at", value: formatDateTime(generatedAt) },
    { label: "Verification reference code", value: verificationCode }
  ]);
  drawReportFieldGroup(doc, [
    { label: "Registration status", value: formatRegistrationStatus(registration.registration_status) },
    { label: "Payment status", value: formatPaymentStatus(registration.payment_status) }
  ]);

  drawReportSection(doc, "Applicant and registration details");
  drawReportFieldGroup(doc, [
    { label: "Full name", value: registration.full_name },
    { label: "Age", value: registration.age },
    { label: "Mobile number", value: registration.mobile_number },
    { label: "Education", value: formatEducation(registration.education_level, registration.education_details) },
    { label: "Permanent address", value: registration.permanent_address },
    { label: "Boys in family", value: registration.boys_count },
    { label: "Girls in family", value: registration.girls_count },
    { label: "Elders in family", value: registration.elders_count },
    { label: "Total family members", value: registration.total_family_members },
    { label: "Registration created at", value: formatDateTime(registration.created_at) },
    { label: "Payment submitted at", value: formatDateTime(registration.payment_submitted_at) }
  ]);

  drawReportSection(doc, "Payment details shown to applicant");
  drawReportFieldGroup(doc, [
    { label: "Payment title", value: paymentSettings?.payment_title },
    { label: "Registration fee", value: formatAmount(paymentSettings?.amount) },
    { label: "UPI ID", value: paymentSettings?.upi_id },
    { label: "Payee name", value: paymentSettings?.payee_name },
    { label: "Payment deadline", value: formatDate(paymentSettings?.payment_deadline) },
    { label: "Support contact", value: paymentSettings?.public_contact },
    { label: "Payment instructions", value: paymentSettings?.instructions }
  ]);

  drawReportSection(doc, "Payment proof image and file details");
  drawReportPaymentScreenshot({
    config: params.config,
    doc,
    proof
  });

  drawReportSection(doc, "Important notice");
  drawReportFieldGroup(doc, [
    { label: "Payment meaning", value: "The applicant pays externally through a UPI application. This portal stores the screenshot as proof for review." },
    { label: "Verification state", value: "Administrative verification is pending. This acknowledgement is not a final payment receipt." }
  ]);

  doc.end();
}
