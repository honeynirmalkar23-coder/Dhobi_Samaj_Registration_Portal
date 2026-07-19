// SERVER-SIDE DEVELOPMENT CODE ONLY

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

type SignedPayload = {
  purpose: string;
  path?: string;
  registrationId?: string;
  acknowledgementNumber?: string;
  expiresAt: number;
};

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createPaymentAccessToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(32).toString("base64url");

  return {
    token,
    tokenHash: hashPaymentAccessToken(token)
  };
}

export function hashPaymentAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSignedPortalToken(payload: SignedPayload, secret: string): string {
  const encodedPayload = encode(payload);
  const signature = sign(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifySignedPortalToken(
  token: string | null,
  secret: string,
  expectedPurpose: string,
  now = Date.now()
): SignedPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature, extra] = token.split(".");

  if (!encodedPayload || !signature || extra !== undefined) {
    return null;
  }

  const expectedSignature = Buffer.from(sign(encodedPayload, secret), "base64url");
  const receivedSignature = Buffer.from(signature, "base64url");

  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return null;
  }

  let payload: SignedPayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SignedPayload;
  } catch {
    return null;
  }

  if (
    payload.purpose !== expectedPurpose ||
    typeof payload.expiresAt !== "number" ||
    payload.expiresAt <= now
  ) {
    return null;
  }

  return payload;
}

export function createSignedFileUrl(params: {
  path: string;
  purpose: "qr" | "admin-file";
  secret: string;
  ttlSeconds: number;
}): string {
  const token = createSignedPortalToken({
    expiresAt: Date.now() + params.ttlSeconds * 1000,
    path: params.path,
    purpose: params.purpose
  }, params.secret);

  return `/api/local-portal/files?token=${encodeURIComponent(token)}`;
}

export function createAcknowledgementDownloadUrl(params: {
  registrationId: string;
  acknowledgementNumber: string;
  secret: string;
  ttlSeconds: number;
}): string {
  const token = createSignedPortalToken({
    acknowledgementNumber: params.acknowledgementNumber,
    expiresAt: Date.now() + params.ttlSeconds * 1000,
    purpose: "acknowledgement",
    registrationId: params.registrationId
  }, params.secret);

  return `/api/local-portal/acknowledgements/${encodeURIComponent(params.registrationId)}.pdf?token=${encodeURIComponent(token)}`;
}

