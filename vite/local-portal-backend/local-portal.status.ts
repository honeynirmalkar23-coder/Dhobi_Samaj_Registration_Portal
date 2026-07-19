// SERVER-SIDE DEVELOPMENT CODE ONLY

import type { Database } from "better-sqlite3";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getRegistrationById } from "./local-portal.registration";
import { getJsonRecord, hasJsonContentType, readJsonBody, writeFailure, writeSuccess } from "./local-portal.responses";

function maskWord(word: string): string {
  const characters = Array.from(word);

  if (characters.length <= 1) {
    return "*";
  }

  if (characters.length === 2) {
    return `${characters[0]}*`;
  }

  return `${characters.slice(0, 2).join("")}${"*".repeat(Math.max(2, characters.length - 2))}`;
}

function maskName(name: string): string {
  return name.split(/\s+/).map(maskWord).join(" ");
}

export async function handlePublicStatusLookup(params: {
  request: IncomingMessage;
  response: ServerResponse;
  db: Database;
}): Promise<void> {
  if (params.request.method !== "POST") {
    writeFailure(params.response, 405, "VALIDATION_ERROR", "यह HTTP method समर्थित नहीं है।");
    return;
  }

  if (!hasJsonContentType(params.request)) {
    writeFailure(params.response, 415, "VALIDATION_ERROR", "अनुरोध content type समर्थित नहीं है।");
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = getJsonRecord(await readJsonBody(params.request));
  } catch {
    writeFailure(params.response, 400, "VALIDATION_ERROR", "स्थिति खोज अनुरोध मान्य नहीं है।");
    return;
  }

  const registrationId = typeof body.registrationId === "string" ? body.registrationId.trim().toUpperCase() : "";

  if (!/^DS-\d{4}-\d{6}$/.test(registrationId)) {
    writeFailure(params.response, 400, "INVALID_REGISTRATION_ID", "मान्य पंजीकरण आईडी दर्ज करें।");
    return;
  }

  const registration = getRegistrationById(params.db, registrationId);

  if (!registration) {
    writeFailure(params.response, 404, "NOT_FOUND", "इस पंजीकरण आईडी से कोई रिकॉर्ड नहीं मिला।");
    return;
  }

  writeSuccess(params.response, {
    lastUpdatedAt: registration.updated_at,
    maskedName: maskName(registration.full_name),
    paymentResubmissionAllowed: Boolean(registration.payment_resubmission_allowed),
    paymentStatus: registration.payment_status,
    publicRejectionMessage: registration.public_rejection_message,
    registrationCreatedAt: registration.created_at,
    registrationId: registration.registration_id,
    registrationStatus: registration.registration_status
  });
}

