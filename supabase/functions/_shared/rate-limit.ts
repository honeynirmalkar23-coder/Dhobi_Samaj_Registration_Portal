import { ApiError } from "./errors.ts";
import { getClientFingerprint, getServiceRoleClient, sha256Hex } from "./security.ts";

export const rateLimitConfig = {
  createRegistration: {
    action: "create-registration",
    limit: 5,
    windowSeconds: 60 * 60
  },
  submitPaymentProof: {
    action: "submit-payment-proof",
    limit: 10,
    windowSeconds: 60 * 60
  },
  statusLookup: {
    action: "get-public-registration-status",
    limit: 30,
    windowSeconds: 60 * 60
  },
  publicPaymentSettings: {
    action: "get-public-payment-settings",
    limit: 60,
    windowSeconds: 60 * 60
  },
  adminDatabaseExportClear: {
    action: "admin-database-export-clear",
    limit: 3,
    windowSeconds: 60 * 60
  }
} as const;

type RateLimitName = keyof typeof rateLimitConfig;
type DebugLog = (message: string, metadata?: Record<string, unknown>) => void;
type RateLimitOptions = {
  debugLog?: DebugLog;
  fetchTimeoutMs?: number;
};

export async function assertRateLimit(
  request: Request,
  name: RateLimitName,
  options: DebugLog | RateLimitOptions = {}
): Promise<void> {
  const debugLog = typeof options === "function" ? options : options.debugLog;
  const fetchTimeoutMs = typeof options === "function" ? undefined : options.fetchTimeoutMs;

  debugLog?.("rate-limit: reading RATE_LIMIT_SALT");
  const salt = Deno.env.get("RATE_LIMIT_SALT");

  if (!salt) {
    debugLog?.("rate-limit: RATE_LIMIT_SALT missing before throw", {
      configured: false
    });
    console.error("[edge-debug] RATE_LIMIT_SALT is missing for rate limit check.");
    throw new ApiError("INTERNAL_ERROR", 500);
  }
  debugLog?.("rate-limit: RATE_LIMIT_SALT read", {
    configured: true
  });

  const config = rateLimitConfig[name];
  const clientFingerprint = getClientFingerprint(request);
  debugLog?.("rate-limit: hashing client fingerprint", {
    action: config.action,
    windowSeconds: config.windowSeconds
  });
  const keyHash = await sha256Hex(`${salt}|${config.action}|${clientFingerprint}`);
  debugLog?.("rate-limit: client fingerprint hashed");
  debugLog?.("rate-limit: creating service role client");
  const supabase = getServiceRoleClient({ fetchTimeoutMs });
  debugLog?.("rate-limit: service role client created");
  debugLog?.("rate-limit: calling consume_public_rate_limit RPC");
  const rateLimitRpc = supabase.rpc("consume_public_rate_limit", {
    p_key_hash: keyHash,
    p_action: config.action,
    p_limit: config.limit,
    p_window_seconds: config.windowSeconds
  });
  const { data, error } = fetchTimeoutMs
    ? await rateLimitRpc.abortSignal(AbortSignal.timeout(fetchTimeoutMs))
    : await rateLimitRpc;
  debugLog?.("rate-limit: consume_public_rate_limit RPC returned", {
    hasError: Boolean(error)
  });

  if (error) {
    console.error("[edge-debug] rate-limit RPC error", error);
    console.dir(error, { depth: null });
    throw new ApiError("INTERNAL_ERROR", 500);
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result?.allowed) {
    debugLog?.("rate-limit: request rejected by rate limiter");
    throw new ApiError("RATE_LIMITED", 429);
  }

  debugLog?.("rate-limit: request allowed");
}
