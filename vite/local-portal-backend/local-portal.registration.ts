// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { Database } from "better-sqlite3";
import type { IncomingMessage, ServerResponse } from "node:http";
import { generateRegistrationId } from "./local-portal.registration-id";
import { validateAndStoreImage, parseMultipartForm, removeStoredUpload } from "./local-portal.files";
import { hasMultipartContentType, writeFailure, writeSuccess } from "./local-portal.responses";
import { createPaymentAccessToken } from "./local-portal.tokens";
import type { LocalPortalConfig, RegistrationRow, StoredUpload } from "./local-portal.types";

const applicantPhotoMaxBytes = 5 * 1024 * 1024;
const paymentTokenTtlDays = 30;

function getField(fields: Map<string, string>, name: string): string {
  return fields.get(name)?.trim() ?? "";
}

function parseInteger(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  return Number.parseInt(value, 10);
}

function validateRegistrationFields(fields: Map<string, string>): {
  ok: true;
  value: {
    fullName: string;
    age: number;
    educationLevel: string;
    educationDetails: string | null;
    permanentAddress: string;
    boysCount: number;
    girlsCount: number;
    eldersCount: number;
    totalFamilyMembers: number;
  };
} | {
  ok: false;
  message: string;
} {
  const fullName = getField(fields, "fullName");
  const age = parseInteger(getField(fields, "age"));
  const educationLevel = getField(fields, "educationLevel");
  const educationDetailsText = getField(fields, "educationDetails");
  const educationDetails = educationDetailsText || null;
  const permanentAddress = getField(fields, "permanentAddress");
  const boysCount = parseInteger(getField(fields, "boysCount"));
  const girlsCount = parseInteger(getField(fields, "girlsCount"));
  const eldersCount = parseInteger(getField(fields, "eldersCount"));

  if (fullName.length < 2 || fullName.length > 100) {
    return { message: "कृपया मान्य नाम दर्ज करें।", ok: false };
  }

  if (age === null || age < 1 || age > 120) {
    return { message: "कृपया मान्य उम्र दर्ज करें।", ok: false };
  }

  if (!educationLevel || (educationLevel === "other" && !educationDetails)) {
    return { message: "कृपया शिक्षा जानकारी पूरी करें।", ok: false };
  }

  if (permanentAddress.length < 10 || permanentAddress.length > 500) {
    return { message: "कृपया मान्य स्थायी पता दर्ज करें।", ok: false };
  }

  if (
    boysCount === null ||
    girlsCount === null ||
    eldersCount === null ||
    boysCount < 0 ||
    girlsCount < 0 ||
    eldersCount < 0 ||
    boysCount > 99 ||
    girlsCount > 99 ||
    eldersCount > 99
  ) {
    return { message: "परिवार सदस्यों की संख्या मान्य नहीं है।", ok: false };
  }

  return {
    ok: true,
    value: {
      age,
      boysCount,
      educationDetails,
      educationLevel,
      eldersCount,
      fullName,
      girlsCount,
      permanentAddress,
      totalFamilyMembers: boysCount + girlsCount + eldersCount
    }
  };
}

export async function handleRegistrationCreate(params: {
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

  let storedPhoto: StoredUpload | null = null;

  try {
    const form = await parseMultipartForm(params.request, {
      maxFileBytes: applicantPhotoMaxBytes,
      maxTotalBytes: applicantPhotoMaxBytes + 256 * 1024
    });
    const fieldValidation = validateRegistrationFields(form.fields);

    if (!fieldValidation.ok) {
      writeFailure(params.response, 400, "VALIDATION_ERROR", fieldValidation.message);
      return;
    }

    storedPhoto = await validateAndStoreImage({
      category: "applicant-photos",
      config: params.config,
      file: form.files.get("applicantPhoto"),
      maxBytes: applicantPhotoMaxBytes
    });

    const now = new Date();
    const nowIso = now.toISOString();
    const paymentToken = createPaymentAccessToken();
    const paymentTokenExpiresAt = new Date(now.getTime() + paymentTokenTtlDays * 24 * 60 * 60 * 1000).toISOString();
    const createRecord = params.db.transaction(() => {
      const registrationId = generateRegistrationId(params.db, now);
      const id = crypto.randomUUID();

      params.db.prepare(`
        INSERT INTO registrations (
          id,
          registration_id,
          full_name,
          age,
          education_level,
          education_details,
          permanent_address,
          boys_count,
          girls_count,
          elders_count,
          total_family_members,
          applicant_photo_path,
          applicant_photo_mime_type,
          applicant_photo_size_bytes,
          registration_status,
          payment_status,
          payment_access_token_hash,
          payment_access_token_expires_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_payment', 'not_submitted', ?, ?, ?, ?)
      `).run(
        id,
        registrationId,
        fieldValidation.value.fullName,
        fieldValidation.value.age,
        fieldValidation.value.educationLevel,
        fieldValidation.value.educationDetails,
        fieldValidation.value.permanentAddress,
        fieldValidation.value.boysCount,
        fieldValidation.value.girlsCount,
        fieldValidation.value.eldersCount,
        fieldValidation.value.totalFamilyMembers,
        storedPhoto?.relativePath,
        storedPhoto?.mimeType,
        storedPhoto?.sizeBytes,
        paymentToken.tokenHash,
        paymentTokenExpiresAt,
        nowIso,
        nowIso
      );

      return registrationId;
    });
    const registrationId = createRecord();

    writeSuccess(params.response, {
      createdAt: nowIso,
      paymentAccessToken: paymentToken.token,
      registrationId
    }, 201);
  } catch (error) {
    await removeStoredUpload(params.config, storedPhoto?.relativePath ?? null);
    writeFailure(
      params.response,
      error instanceof Error && error.message === "FILE_TOO_LARGE" ? 413 : 400,
      error instanceof Error && error.message === "FILE_TOO_LARGE" ? "FILE_TOO_LARGE" : "VALIDATION_ERROR",
      error instanceof Error && error.message === "FILE_TOO_LARGE"
        ? "फोटो फाइल बहुत बड़ी है।"
        : "पंजीकरण जानकारी मान्य नहीं है।"
    );
  }
}

export function getRegistrationById(db: Database, registrationId: string): RegistrationRow | null {
  return db
    .prepare("SELECT * FROM registrations WHERE registration_id = ?")
    .get(registrationId) as RegistrationRow | undefined ?? null;
}

