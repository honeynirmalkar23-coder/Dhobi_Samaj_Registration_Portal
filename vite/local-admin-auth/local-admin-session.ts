// SERVER-SIDE DEVELOPMENT CODE ONLY

import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { LocalAdminSessionPayload, LocalAdminUser } from "./local-admin-auth.types";

export const localAdminSessionCookieName = "dhobi_dev_admin_session";

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string | null {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function signValue(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function hasValidSignature(value: string, signature: string, secret: string): boolean {
  const expectedSignature = signValue(value, secret);
  const received = Buffer.from(signature, "base64url");
  const expected = Buffer.from(expectedSignature, "base64url");

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
}

function parseCookieHeader(header: string | string[] | undefined): Map<string, string> {
  const cookies = new Map<string, string>();
  const cookieHeader = Array.isArray(header) ? header.join(";") : header;

  if (!cookieHeader) {
    return cookies;
  }

  for (const segment of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = segment.trim().split("=");
    const name = rawName?.trim();

    if (!name) {
      continue;
    }

    cookies.set(name, rawValueParts.join("="));
  }

  return cookies;
}

export function getLocalAdminSessionToken(request: IncomingMessage): string | null {
  return parseCookieHeader(request.headers.cookie).get(localAdminSessionCookieName) ?? null;
}

export function createLocalAdminSessionToken(params: {
  email: string;
  displayName?: string;
  secret: string;
  ttlSeconds: number;
  now?: number;
}): string {
  const now = params.now ?? Date.now();
  const displayName = params.displayName?.trim();
  const payload: LocalAdminSessionPayload = {
    authenticationMode: "local-dev",
    email: params.email,
    expiresAt: now + params.ttlSeconds * 1000,
    issuedAt: now,
    role: "admin",
    ...(displayName ? { displayName } : {})
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signValue(encodedPayload, params.secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyLocalAdminSessionToken(
  token: string | null,
  secret: string,
  now = Date.now()
): LocalAdminUser | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature, extra] = token.split(".");

  if (!encodedPayload || !signature || extra !== undefined) {
    return null;
  }

  if (!hasValidSignature(encodedPayload, signature, secret)) {
    return null;
  }

  const decodedPayload = base64UrlDecode(encodedPayload);

  if (!decodedPayload) {
    return null;
  }

  let payload: LocalAdminSessionPayload;
  try {
    payload = JSON.parse(decodedPayload) as LocalAdminSessionPayload;
  } catch {
    return null;
  }

  if (
    payload.authenticationMode !== "local-dev" ||
    payload.role !== "admin" ||
    typeof payload.email !== "string" ||
    ("displayName" in payload && typeof payload.displayName !== "string") ||
    typeof payload.issuedAt !== "number" ||
    typeof payload.expiresAt !== "number" ||
    payload.expiresAt <= now
  ) {
    return null;
  }

  return {
    authenticationMode: "local-dev",
    ...(payload.displayName ? { displayName: payload.displayName } : {}),
    email: payload.email,
    role: "admin"
  };
}

export function serializeLocalAdminSessionCookie(params: {
  token: string;
  maxAgeSeconds: number;
  secure: boolean;
}): string {
  return [
    `${localAdminSessionCookieName}=${params.token}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${params.maxAgeSeconds}`,
    params.secure ? "Secure" : null
  ]
    .filter(Boolean)
    .join("; ");
}

export function serializeLocalAdminSessionClearCookie(): string {
  return [
    `${localAdminSessionCookieName}=`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0"
  ].join("; ");
}
