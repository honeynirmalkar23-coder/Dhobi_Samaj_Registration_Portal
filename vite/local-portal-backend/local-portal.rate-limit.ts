// SERVER-SIDE DEVELOPMENT CODE ONLY

import { createHash } from "node:crypto";
import type { IncomingMessage } from "node:http";

type RateLimitEntry = {
  count: number;
  windowStartedAt: number;
};

const entries = new Map<string, RateLimitEntry>();
const limitMessage = "बहुत अधिक अनुरोध किए गए हैं। कृपया कुछ समय बाद पुनः प्रयास करें।";

function getAddress(request: IncomingMessage): string {
  const forwardedFor = request.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];

  return firstForwarded?.trim() || request.socket.remoteAddress || "unknown";
}

function keyFor(request: IncomingMessage, bucket: string, subject = ""): string {
  return createHash("sha256")
    .update(`${bucket}:${getAddress(request)}:${subject}`)
    .digest("hex");
}

export function isRateLimited(params: {
  request: IncomingMessage;
  bucket: string;
  max: number;
  windowMs: number;
  subject?: string;
  now?: number;
}): boolean {
  const now = params.now ?? Date.now();
  const key = keyFor(params.request, params.bucket, params.subject ?? "");
  const existing = entries.get(key);
  const entry = !existing || now - existing.windowStartedAt >= params.windowMs
    ? {
        count: 0,
        windowStartedAt: now
      }
    : existing;

  entry.count += 1;
  entries.set(key, entry);

  return entry.count > params.max;
}

export function getRateLimitMessage(): string {
  return limitMessage;
}

export function resetLocalPortalRateLimitsForTests(): void {
  entries.clear();
}

