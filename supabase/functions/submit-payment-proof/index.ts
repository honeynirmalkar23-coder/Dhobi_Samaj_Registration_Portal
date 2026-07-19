import { getCorsHeaders, handleOptions } from "../_shared/cors.ts";
import { ApiError, toSafeApiError } from "../_shared/errors.ts";
import { validateImageFile } from "../_shared/file-validation.ts";
import { assertRateLimit } from "../_shared/rate-limit.ts";
import { failureResponse, successResponse } from "../_shared/response.ts";
import { getServiceRoleClient, sha256Hex } from "../_shared/security.ts";
import { assertRegistrationId, normalizeString } from "../_shared/validation.ts";

const paymentProofMaxSizeBytes = 5 * 1024 * 1024;
const acknowledgementBucketName = "payment-acknowledgements";
const acknowledgementSignedUrlTtlSeconds = 30 * 60;

type RegistrationRecord = {
  age: number;
  boys_count: number;
  created_at: string;
  education_details: string | null;
  education_level: string;
  elders_count: number;
  full_name: string;
  girls_count: number;
  id: string;
  payment_access_token_expires_at: string;
  payment_resubmission_allowed: boolean;
  payment_status: string;
  permanent_address: string;
  registration_id: string;
  total_family_members: number;
};

type PaymentSettingsRecord = {
  amount: number | string | null;
  instructions: string | null;
  payee_name: string | null;
  payment_deadline: string | null;
  payment_title: string | null;
  public_contact: string | null;
  upi_id: string | null;
};

function createAcknowledgementNumber(registrationId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();

  return `ACK-${registrationId}-${timestamp}-${suffix}`;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata"
  }).format(date);
}

function formatAmount(value: number | string | null | undefined): string {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Unavailable";
  }

  return `INR ${amount.toFixed(2)}`;
}

function formatEducation(level: string, details: string | null): string {
  if (level === "other" && details) {
    return details;
  }

  return details ? `${level} - ${details}` : level;
}

function formatPdfText(value: unknown): string {
  return String(value ?? "Unavailable")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\s+/g, " ")
    .trim() || "Unavailable";
}

function escapePdfText(value: unknown): string {
  return formatPdfText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapPdfText(value: unknown, maxLength = 86): string[] {
  const words = formatPdfText(value).split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
      continue;
    }

    if (`${currentLine} ${word}`.length > maxLength) {
      lines.push(currentLine);
      currentLine = word;
      continue;
    }

    currentLine = `${currentLine} ${word}`;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : ["Unavailable"];
}

function buildPdfDocument(lines: string[]): Uint8Array {
  const encoder = new TextEncoder();
  const contentLines: string[] = [];
  let y = 790;

  for (const line of lines) {
    const fontSize = line.startsWith("# ") ? 17 : line.startsWith("## ") ? 12 : 10;
    const text = line.replace(/^##?\s/, "");

    contentLines.push("BT");
    contentLines.push(`/F1 ${fontSize} Tf`);
    contentLines.push(`1 0 0 1 50 ${y} Tm`);
    contentLines.push(`(${escapePdfText(text)}) Tj`);
    contentLines.push("ET");
    y -= fontSize === 17 ? 24 : 15;

    if (y < 56) {
      break;
    }
  }

  const content = `${contentLines.join("\n")}\n`;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n",
    `4 0 obj\n<< /Length ${encoder.encode(content).length} >>\nstream\n${content}endstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
  ];
  const header = "%PDF-1.4\n";
  const offsets: number[] = [];
  let position = encoder.encode(header).length;

  for (const object of objects) {
    offsets.push(position);
    position += encoder.encode(object).length;
  }

  const xref = [
    `xref\n0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.map((offset) => `${offset.toString().padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(position),
    "%%EOF"
  ].join("\n");

  return encoder.encode(`${header}${objects.join("")}${xref}\n`);
}

function createAcknowledgementPdf(params: {
  acknowledgementNumber: string;
  generatedAt: string;
  paymentSettings: PaymentSettingsRecord | null;
  paymentScreenshotName: string | null;
  paymentScreenshotSizeBytes: number;
  registration: RegistrationRecord;
  submittedAt: string;
}): Uint8Array {
  const detailLines = [
    "# Payment Proof Submission Acknowledgement",
    "This acknowledgement confirms that a payment-proof image was submitted. It does not confirm that the payment has been received or verified.",
    "## Acknowledgement summary",
    `Acknowledgement number: ${params.acknowledgementNumber}`,
    `Registration ID: ${params.registration.registration_id}`,
    `Applicant name: ${params.registration.full_name}`,
    `Screenshot submitted at: ${formatDateTime(params.submittedAt)}`,
    `Generated at: ${formatDateTime(params.generatedAt)}`,
    "Verification state: Administrative verification is pending.",
    "Document type: Pending-verification acknowledgement, not a final payment receipt.",
    "## Applicant and registration details",
    `Full name: ${params.registration.full_name}`,
    `Age: ${params.registration.age}`,
    `Education: ${formatEducation(params.registration.education_level, params.registration.education_details)}`,
    `Permanent address: ${params.registration.permanent_address}`,
    `Boys in family: ${params.registration.boys_count}`,
    `Girls in family: ${params.registration.girls_count}`,
    `Elders in family: ${params.registration.elders_count}`,
    `Total family members: ${params.registration.total_family_members}`,
    `Registration created at: ${formatDateTime(params.registration.created_at)}`,
    "## Payment details shown to applicant",
    `Payment title: ${params.paymentSettings?.payment_title ?? "Unavailable"}`,
    `Registration fee: ${formatAmount(params.paymentSettings?.amount)}`,
    `UPI ID: ${params.paymentSettings?.upi_id ?? "Unavailable"}`,
    `Payee name: ${params.paymentSettings?.payee_name ?? "Unavailable"}`,
    `Payment deadline: ${formatDateTime(params.paymentSettings?.payment_deadline)}`,
    `Support contact: ${params.paymentSettings?.public_contact ?? "Unavailable"}`,
    `Payment instructions: ${params.paymentSettings?.instructions ?? "Unavailable"}`,
    "## Payment proof file details",
    `Original filename: ${params.paymentScreenshotName ?? "Unavailable"}`,
    `File size: ${params.paymentScreenshotSizeBytes} bytes`,
    "Stored status: Pending administrator verification."
  ];

  return buildPdfDocument(detailLines.flatMap((line) => wrapPdfText(line)));
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

    await assertRateLimit(request, "submitPaymentProof");

    const formData = await request.formData();
    const registrationId = assertRegistrationId(formData.get("registrationId"));
    const paymentAccessToken = normalizeString(formData.get("paymentAccessToken"));
    const declarationAccepted = normalizeString(formData.get("declarationAccepted"));

    if (!paymentAccessToken || declarationAccepted !== "true") {
      throw new ApiError("VALIDATION_ERROR", 400);
    }

    const paymentScreenshot = await validateImageFile(
      formData.get("paymentScreenshot"),
      paymentProofMaxSizeBytes
    );
    const tokenHash = await sha256Hex(paymentAccessToken);
    const supabase = getServiceRoleClient();
    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .select("id, registration_id, full_name, age, education_level, education_details, permanent_address, boys_count, girls_count, elders_count, total_family_members, payment_status, payment_resubmission_allowed, payment_access_token_expires_at, created_at")
      .eq("registration_id", registrationId)
      .eq("payment_access_token_hash", tokenHash)
      .maybeSingle();

    if (registrationError) {
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    if (!registration || new Date(registration.payment_access_token_expires_at).getTime() <= Date.now()) {
      throw new ApiError("PAYMENT_TOKEN_INVALID", 403);
    }

    const canSubmit =
      registration.payment_status === "not_submitted" ||
      (registration.payment_status === "rejected" && registration.payment_resubmission_allowed);

    if (!canSubmit) {
      throw new ApiError("PAYMENT_SUBMISSION_NOT_ALLOWED", 409);
    }

    const { data: paymentSettings, error: paymentSettingsError } = await supabase
      .from("payment_settings")
      .select("amount, instructions, payee_name, payment_deadline, payment_title, public_contact, upi_id")
      .eq("id", 1)
      .maybeSingle();

    if (paymentSettingsError) {
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    const year = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric"
    }).format(new Date());
    const proofId = crypto.randomUUID();
    const storagePath = `${year}/${registration.id}/${proofId}.${paymentScreenshot.extension}`;
    const acknowledgementNumber = createAcknowledgementNumber(registrationId);
    const submittedAt = new Date().toISOString();
    const generatedAt = new Date().toISOString();
    const acknowledgementPdfPath = `${year}/${registration.id}/${proofId}.pdf`;
    const acknowledgementPdf = createAcknowledgementPdf({
      acknowledgementNumber,
      generatedAt,
      paymentSettings: paymentSettings as PaymentSettingsRecord | null,
      paymentScreenshotName: paymentScreenshot.file.name || null,
      paymentScreenshotSizeBytes: paymentScreenshot.sizeBytes,
      registration: registration as RegistrationRecord,
      submittedAt
    });
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(storagePath, paymentScreenshot.file, {
        contentType: paymentScreenshot.mimeType,
        upsert: false
      });

    if (uploadError) {
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    const { error: acknowledgementUploadError } = await supabase.storage
      .from(acknowledgementBucketName)
      .upload(acknowledgementPdfPath, new Blob([acknowledgementPdf], { type: "application/pdf" }), {
        contentType: "application/pdf",
        upsert: false
      });

    if (acknowledgementUploadError) {
      await supabase.storage.from("payment-proofs").remove([storagePath]);
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    const { data: acknowledgementSignedUrl, error: acknowledgementSignedUrlError } = await supabase.storage
      .from(acknowledgementBucketName)
      .createSignedUrl(acknowledgementPdfPath, acknowledgementSignedUrlTtlSeconds);

    if (acknowledgementSignedUrlError || !acknowledgementSignedUrl?.signedUrl) {
      await Promise.all([
        supabase.storage.from("payment-proofs").remove([storagePath]),
        supabase.storage.from(acknowledgementBucketName).remove([acknowledgementPdfPath])
      ]);
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    const { data, error } = await supabase.rpc("submit_payment_proof_record", {
      p_acknowledgement_number: acknowledgementNumber,
      p_acknowledgement_pdf_path: acknowledgementPdfPath,
      p_registration_id: registrationId,
      p_payment_access_token_hash: tokenHash,
      p_storage_path: storagePath,
      p_original_filename: paymentScreenshot.file.name || null,
      p_mime_type: paymentScreenshot.mimeType,
      p_size_bytes: paymentScreenshot.sizeBytes,
      p_submitted_at: submittedAt
    });

    if (error) {
      await Promise.all([
        supabase.storage.from("payment-proofs").remove([storagePath]),
        supabase.storage.from(acknowledgementBucketName).remove([acknowledgementPdfPath])
      ]);
      if (error.message.toLowerCase().includes("payment token invalid")) {
        throw new ApiError("PAYMENT_TOKEN_INVALID", 403);
      }
      if (error.message.toLowerCase().includes("payment submission not allowed")) {
        throw new ApiError("PAYMENT_SUBMISSION_NOT_ALLOWED", 409);
      }
      throw new ApiError("INTERNAL_ERROR", 500);
    }

    const result = Array.isArray(data) ? data[0] : data;

    return successResponse(
      {
        registrationId: result.registration_id,
        registrationStatus: result.registration_status,
        paymentStatus: result.payment_status,
        submittedAt: result.submitted_at,
        acknowledgementAvailable: true,
        acknowledgementDownloadUrl: acknowledgementSignedUrl.signedUrl,
        acknowledgementNumber: result.acknowledgement_number ?? acknowledgementNumber
      },
      corsHeaders
    );
  } catch (error) {
    const safeError = toSafeApiError(error);

    return failureResponse(safeError.code, safeError.message, safeError.status, corsHeaders);
  }
});
