// SERVER-SIDE DEVELOPMENT CODE ONLY

import { createHash } from "node:crypto";
import type { IncomingMessage } from "node:http";

const maxFailedAttempts = 5;
const windowMilliseconds = 15 * 60 * 1000;

type RateLimitEntry = {
  failedAttempts: number;
  windowStartedAt: number;
};

const entries = new Map<string, RateLimitEntry>();

function getRequestAddress(request: IncomingMessage): string {
  const forwardedFor = request.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];

  return firstForwarded?.trim() || request.socket.remoteAddress || "unknown";
}

function createKey(request: IncomingMessage, normalizedEmail: string): string {
  return createHash("sha256")
    .update(`${getRequestAddress(request)}:${normalizedEmail}`)
    .digest("hex");
}

function getEntry(key: string, now: number): RateLimitEntry {
  const existing = entries.get(key);

  if (!existing || now - existing.windowStartedAt >= windowMilliseconds) {
    const entry = {
      failedAttempts: 0,
      windowStartedAt: now
    };
    entries.set(key, entry);

    return entry;
  }

  return existing;
}

export function isLocalAdminLoginRateLimited(
  request: IncomingMessage,
  normalizedEmail: string,
  now = Date.now()
): boolean {
  const key = createKey(request, normalizedEmail);
  const entry = getEntry(key, now);

  return entry.failedAttempts >= maxFailedAttempts;
}

export function recordLocalAdminFailedLogin(
  request: IncomingMessage,
  normalizedEmail: string,
  now = Date.now()
): void {
  const key = createKey(request, normalizedEmail);
  const entry = getEntry(key, now);

  entry.failedAttempts += 1;
}

export function clearLocalAdminFailedLogins(
  request: IncomingMessage,
  normalizedEmail: string
): void {
  entries.delete(createKey(request, normalizedEmail));
}

export function resetLocalAdminRateLimitForTests(): void {
  entries.clear();
}
